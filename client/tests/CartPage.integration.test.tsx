import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { AxiosError } from "axios";
import api from "../src/api/axiosInstance";
import CartPage from "../src/pages/buyer/CartPage";
import { toast } from "sonner";

// Keep the real page, React state, QueryClient and Axios request path. Only
// presentation/auth chrome and toast rendering are replaced; no Clerk keys.
vi.mock("../src/components/Navbar", () => ({ default: () => <nav>Test navigation</nav> }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("framer-motion", async () => {
  const React = await import("react");
  const tags = new Map();
  return { AnimatePresence: ({ children }) => children,
    motion: new Proxy({}, { get: (_, tag: string) => {
      if (!tags.has(tag)) tags.set(tag, React.forwardRef(({ initial, animate, exit, transition, whileTap, ...props }: any, ref) => React.createElement(tag, { ...props, ref })));
      return tags.get(tag);
    } }) };
});

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(r => { resolve = r; });
  return { promise, resolve };
}
const line = (product: string, quantity = 1) => ({ product, name: `Product ${product}`, price: 10, quantity, unit: "pcs" });

// Synthetic HTTP boundary with server-like revision checking. A deferred write
// captures its read revision before waiting, so overlapping saves really fail.
class CartAPI {
  cart = { _id: "synthetic-cart", __v: 0, items: [line("A"), line("B")], totalAmount: 20 };
  calls: any[] = [];
  posts: any[] = [];
  gates: ReturnType<typeof deferred>[] = [];
  nextWrite?: ReturnType<typeof deferred>;
  nextGet?: ReturnType<typeof deferred>;
  failWrite = false;
  activeWrites = 0;
  maxWrites = 0;
  holdWrite() { const g = deferred(); this.gates.push(g); this.nextWrite = g; return g; }
  holdGet() { const g = deferred(); this.gates.push(g); this.nextGet = g; return g; }
  release() { this.gates.forEach(g => g.resolve()); }
  snapshot() { return structuredClone(this.cart); }
  totals() { this.cart.totalAmount = this.cart.items.reduce((s, i) => s + i.quantity * i.price, 0); }
  error(config: any, code: number, message: string): never {
    throw new AxiosError(message, String(code), config, undefined, { status: code, data: { message }, headers: {}, config, statusText: "Synthetic failure" });
  }
  request = async (config: any) => {
    const method = config.method, path = config.url;
    const data = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
    this.calls.push({ method, path, data, signal: config.signal });
    const respond = (body: any) => ({ data: { status: "success", data: body }, status: 200, statusText: "OK", headers: {}, config });
    if (method === "get" && path === "/cart") {
      const captured = this.snapshot(), gate = this.nextGet; this.nextGet = undefined;
      if (gate) await gate.promise;
      return respond({ cart: captured, priceChanged: false });
    }
    if (method === "post" && path === "/orders") {
      this.posts.push(data);
      if (data.cartVersion !== this.cart.__v) this.error(config, 409, "Cart changed");
      this.cart.items = []; this.cart.__v++; this.totals();
      return respond({ order: { items: [], totalAmount: 0 } });
    }
    if (method === "post" && path === "/cart/add") {
      this.cart.items.push(line(data.productId)); this.cart.__v++; this.totals();
      return respond({ cart: this.snapshot() });
    }
    const revision = this.cart.__v, gate = this.nextWrite; this.nextWrite = undefined;
    this.activeWrites++; this.maxWrites = Math.max(this.maxWrites, this.activeWrites);
    try {
      if (gate) await gate.promise;
      if (this.failWrite) { this.failWrite = false; this.error(config, 503, "Synthetic save failure"); }
      if (revision !== this.cart.__v) this.error(config, 409, "Cart write conflict");
      if (method === "patch") {
        const item = this.cart.items.find(i => i.product === path.split("/").at(-1));
        if (!item) this.error(config, 404, "Item not found in cart");
        if (item.quantity !== data.quantity) { item.quantity = data.quantity; this.cart.__v++; }
      } else if (path === "/cart/clear") { this.cart.items = []; this.cart.__v++; }
      else { this.cart.items = this.cart.items.filter(i => i.product !== path.split("/").at(-1)); this.cart.__v++; }
      this.totals();
      return respond(path === "/cart/clear" ? null : { cart: this.snapshot() });
    } finally { this.activeWrites--; }
  };
}

let model: CartAPI, client: QueryClient;
const originalAdapter = api.defaults.adapter;
beforeEach(() => {
  model = new CartAPI(); api.defaults.adapter = model.request;
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
});
afterEach(async () => {
  cleanup(); model.release(); await client.cancelQueries(); client.clear(); api.defaults.adapter = originalAdapter;
});
async function mount() {
  render(<QueryClientProvider client={client}><MemoryRouter><CartPage /></MemoryRouter></QueryClientProvider>);
  await screen.findByText("Product A");
  return userEvent.setup();
}
function input(id: string) { return within(screen.getByText(`Product ${id}`).closest("tr")!).getByRole("spinbutton") as HTMLInputElement; }
function remove(id: string) { return within(screen.getByText(`Product ${id}`).closest("tr")!).getByRole("button", { name: "Remove" }); }
const checkout = () => screen.getByRole("button", { name: /checkout/i });
const confirm = () => screen.findByText("Confirm Order");
const patches = () => model.calls.filter(c => c.method === "patch");
async function editAndSave(user: ReturnType<typeof userEvent.setup>, id: string, quantity: number) {
  const field = input(id); field.focus(); fireEvent.change(field, { target: { value: String(quantity) } });
  await user.tab();
  await waitFor(() => expect(model.cart.items.find(i => i.product === id)?.quantity).toBe(quantity));
}

describe("cart mutation and confirmation integration", () => {
  it("edit/remove/checkout excludes the removed product and its draft", async () => {
    const user = await mount(); await editAndSave(user, "A", 2);
    await user.click(remove("A")); await waitFor(() => expect(screen.queryByText("Product A")).toBeNull());
    const writes = patches().length;
    await user.click(checkout()); await confirm();
    expect(patches().length).toBe(writes);
    expect(screen.getByText(/Product B/, { selector: "span" })).toBeTruthy();
  });

  it("edit/clear/re-add never replays the old product generation", async () => {
    const user = await mount(); fireEvent.change(input("A"), { target: { value: "4" } });
    await user.click(screen.getByRole("button", { name: "Clear Cart" })); await screen.findByText("Your cart is empty");
    await act(async () => { await api.post("/cart/add", { productId: "A" }); await client.invalidateQueries({ queryKey: ["cart"] }); });
    await screen.findByText("Product A");
    expect(input("A").value).toBe("1");
    await user.click(checkout()); await confirm();
    await act(async () => { await new Promise(r => setTimeout(r, 650)); });
    expect(model.cart.items[0].quantity).toBe(1);
    expect(patches()).toHaveLength(0);
  });

  it("waits for blur before checkout instead of issuing a competing save", async () => {
    const user = await mount(), gate = model.holdWrite();
    input("A").focus(); fireEvent.change(input("A"), { target: { value: "2" } });
    await user.click(checkout());
    await waitFor(() => expect(patches().length).toBeGreaterThan(0));
    expect(patches()).toHaveLength(1);
    expect(input("A").disabled).toBe(true); expect(checkout().disabled).toBe(true);
    await act(async () => gate.resolve()); await confirm();
    expect(model.maxWrites).toBe(1); expect(model.cart.items[0].quantity).toBe(2);
  });

  it("drains an already-running debounce before confirmation", async () => {
    const user = await mount(), gate = model.holdWrite();
    fireEvent.change(input("A"), { target: { value: "3" } });
    await waitFor(() => expect(patches()).toHaveLength(1), { timeout: 1500 });
    await user.click(checkout()); expect(patches()).toHaveLength(1);
    await act(async () => gate.resolve()); await confirm();
    expect(model.maxWrites).toBe(1); expect(model.cart.items[0].quantity).toBe(3);
  });

  it("serializes multiple dirty lines and coalesces repeated Checkout clicks", async () => {
    const user = await mount(), gate = model.holdWrite();
    fireEvent.change(input("A"), { target: { value: "2" } }); fireEvent.change(input("B"), { target: { value: "3" } });
    fireEvent.click(checkout()); fireEvent.click(checkout()); fireEvent.click(checkout());
    await waitFor(() => expect(patches().length).toBeGreaterThan(0));
    expect(patches()).toHaveLength(1);
    await act(async () => gate.resolve()); await confirm();
    expect(patches()).toHaveLength(2); expect(model.maxWrites).toBe(1);
    expect(model.cart.items.map(i => i.quantity)).toEqual([2, 3]);
    await user.click(screen.getByRole("button", { name: "Place Order" }));
    await waitFor(() => expect(model.posts).toHaveLength(1));
    expect(model.posts[0].cartVersion).toBe(2);
  });

  it("preserves the unsaved draft and stops preparation when an in-flight write fails", async () => {
    const user = await mount(), gate = model.holdWrite(); model.failWrite = true;
    input("A").focus(); fireEvent.change(input("A"), { target: { value: "5" } }); await user.click(checkout());
    await waitFor(() => expect(patches().length).toBeGreaterThan(0));
    await act(async () => gate.resolve());
    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
    expect(screen.queryByText("Confirm Order")).toBeNull(); expect(input("A").value).toBe("5");
    expect(patches()).toHaveLength(1);
    // An explicit later checkout retries the preserved draft.
    await user.click(checkout()); await confirm(); expect(model.cart.items[0].quantity).toBe(5);
  });

  it("uses a new post-write GET, not a delayed background query", async () => {
    const user = await mount(), old = model.holdGet();
    let refetch: Promise<unknown>;
    await act(async () => { refetch = client.refetchQueries({ queryKey: ["cart"] }).catch(() => {}); });
    const getCount = model.calls.filter(c => c.method === "get").length;
    fireEvent.change(input("A"), { target: { value: "2" } });
    await user.click(checkout());
    await waitFor(() => expect(model.calls.filter(c => c.method === "get").length).toBeGreaterThan(getCount));
    await confirm();
    await act(async () => { old.resolve(); await refetch!; });
    expect(screen.getByText("× 2")).toBeTruthy();
    expect(client.getQueryData<any>(["cart"]).items[0].quantity).toBe(2);
    expect(model.calls.filter(c => c.method === "get")[getCount - 1].signal.aborted).toBe(true);
    await user.click(screen.getByRole("button", { name: "Place Order" }));
    await waitFor(() => expect(model.posts).toHaveLength(1));
    expect(model.posts[0].cartVersion).toBe(1);
    expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
  });

  it("cancels pending draft timers when removing an item", async () => {
    const user = await mount(); fireEvent.change(input("A"), { target: { value: "2" } });
    await user.click(remove("A")); await waitFor(() => expect(screen.queryByText("Product A")).toBeNull());
    await act(async () => { await new Promise(r => setTimeout(r, 650)); });
    expect(patches()).toHaveLength(0); expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
  });

  it("drains an in-flight save before removal without resurrecting that product", async () => {
    const user = await mount(), gate = model.holdWrite();
    fireEvent.change(input("A"), { target: { value: "2" } });
    await waitFor(() => expect(patches()).toHaveLength(1), { timeout: 1500 });
    await user.click(remove("A"));
    expect(model.calls.filter(c => c.method === "delete")).toHaveLength(0);
    await act(async () => gate.resolve());
    await waitFor(() => expect(screen.queryByText("Product A")).toBeNull());
    await user.click(checkout()); await confirm();
    expect(model.maxWrites).toBe(1); expect(patches()).toHaveLength(1);
    expect(model.cart.items.map(i => i.product)).toEqual(["B"]);
  });

  it("prunes a product removed externally before replaying drafts", async () => {
    const user = await mount(); fireEvent.change(input("A"), { target: { value: "2" } });
    model.cart.items = [line("B")]; model.cart.__v++; model.totals();
    await user.click(checkout()); await confirm();
    expect(patches()).toHaveLength(0); expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
  });

  it("retains a newer draft while an older generation is in flight", async () => {
    const user = await mount(), gate = model.holdWrite();
    fireEvent.change(input("A"), { target: { value: "2" } });
    await waitFor(() => expect(patches()).toHaveLength(1), { timeout: 1500 });
    fireEvent.change(input("A"), { target: { value: "3" } });
    await user.click(checkout()); await act(async () => gate.resolve()); await confirm();
    expect(patches().map(c => c.data.quantity)).toEqual([2, 3]);
    expect(model.cart.items[0].quantity).toBe(3); expect(model.maxWrites).toBe(1);
  });

  it("keeps the draft visible when removal fails instead of pretending it succeeded", async () => {
    const user = await mount(); fireEvent.change(input("A"), { target: { value: "4" } }); model.failWrite = true;
    await user.click(remove("A"));
    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
    expect(input("A").value).toBe("4"); expect(model.cart.items[0].quantity).toBe(1);
    await user.click(checkout()); await confirm(); expect(model.cart.items[0].quantity).toBe(4);
  });

  it("does not report intentional unmount cancellation as a checkout failure", async () => {
    const user = await mount(), gate = model.holdGet();
    await user.click(checkout());
    await waitFor(() => expect(model.calls.filter(c => c.method === "get")).toHaveLength(2));
    cleanup();
    await act(async () => { gate.resolve(); await new Promise(r => setTimeout(r, 0)); });
    expect(vi.mocked(toast.error)).not.toHaveBeenCalled();
  });

  it("does not publish an old editor's response over a later cart after unmount", async () => {
    await mount(); const gate = model.holdWrite();
    fireEvent.change(input("A"), { target: { value: "2" } });
    await waitFor(() => expect(patches()).toHaveLength(1), { timeout: 1500 });
    cleanup();
    client.setQueryData(["cart"], { _id: "later-cart", __v: 0, items: [line("C")], totalAmount: 10 });
    await act(async () => { gate.resolve(); await new Promise(r => setTimeout(r, 0)); });
    expect(client.getQueryData<any>(["cart"])._id).toBe("later-cart");
  });

  it("does not start a queued removal after its editor is unmounted", async () => {
    const user = await mount(), gate = model.holdWrite();
    fireEvent.change(input("A"), { target: { value: "2" } });
    await waitFor(() => expect(patches()).toHaveLength(1), { timeout: 1500 });
    await user.click(remove("B")); cleanup();
    await act(async () => { gate.resolve(); await new Promise(r => setTimeout(r, 0)); });
    expect(model.calls.filter(c => c.method === "delete")).toHaveLength(0);
  });
});
