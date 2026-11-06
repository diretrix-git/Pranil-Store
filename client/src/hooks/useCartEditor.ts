import { useEffect, useRef, useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { CanceledError, isCancel } from "axios";
import api from "../api/axiosInstance";
import { prepareCheckout, type ServerCart } from "../utils/checkout";

type Draft = { value: number | string };
const key = ["cart"];
const valid = (value: number | string) => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 500;

export function useCartEditor(
  queryClient: QueryClient,
  cart: ServerCart | undefined,
  fetchCart: (signal?: AbortSignal) => Promise<ServerCart>,
  reportError: (error: unknown) => void,
  disabled: boolean,
) {
  const [localQty, setLocalQty] = useState<Record<string, number | string>>({});
  const [isPreparing, setPreparing] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const drafts = useRef<Record<string, Draft>>({});
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const queued = useRef(new Map<string, { draft: Draft; promise: Promise<void> }>());
  const queue = useRef({ tail: Promise.resolve(), failures: 0, error: undefined as unknown });
  const preparing = useRef(false), deleting = useRef(false), mounted = useRef(true);
  const disabledRef = useRef(disabled); disabledRef.current = disabled;
  const freshRequest = useRef<AbortController | null>(null);
  const currentCart = useRef(cart); currentCart.current = cart;
  const locked = () => preparing.current || deleting.current || disabledRef.current || !mounted.current;

  const syncDrafts = () => {
    if (mounted.current) setLocalQty(Object.fromEntries(Object.entries(drafts.current).map(([id, draft]) => [id, draft.value])));
  };
  const cancelTimer = (id: string) => { clearTimeout(timers.current.get(id)); timers.current.delete(id); };
  const cancelTimers = () => { timers.current.forEach(clearTimeout); timers.current.clear(); };
  const discard = (id: string) => { cancelTimer(id); delete drafts.current[id]; syncDrafts(); };
  const prune = (snapshot: ServerCart) => {
    const ids = new Set(snapshot.items.map(item => String(item.product)));
    for (const id of Object.keys(drafts.current)) if (!ids.has(id)) discard(id);
  };
  const publish = (snapshot: ServerCart) => {
    if (!mounted.current) return;
    queryClient.setQueryData<ServerCart>(key, previous =>
      previous && previous._id === snapshot._id && previous.__v > snapshot.__v ? previous : snapshot);
  };
  const enqueue = <T,>(operation: () => Promise<T>): Promise<T> => {
    const result = queue.current.tail.then(operation);
    // Keep the queue usable after failure, but retain evidence for a preparation
    // that is draining that failed operation. Never silently retry it there.
    queue.current.tail = result.then(() => {}, error => {
      queue.current.failures++; queue.current.error = error;
    });
    return result;
  };
  const freshCart = async () => {
    if (!mounted.current) throw new CanceledError("Cart editor disposed");
    await queryClient.cancelQueries({ queryKey: key });
    if (!mounted.current) throw new CanceledError("Cart editor disposed");
    const controller = new AbortController(); freshRequest.current = controller;
    try {
      // Deliberately outside QueryClient.fetchQuery: an older in-flight GET
      // cannot satisfy this mandatory post-write request.
      const snapshot = await fetchCart(controller.signal);
      publish(snapshot); prune(snapshot);
      return snapshot;
    } finally { if (freshRequest.current === controller) freshRequest.current = null; }
  };
  const save = (id: string): Promise<void> => {
    cancelTimer(id);
    const draft = drafts.current[id];
    if (!draft) return Promise.resolve();
    const pending = queued.current.get(id);
    if (pending?.draft === draft) return pending.promise;
    const promise = enqueue(async () => {
      const snapshot = queryClient.getQueryData<ServerCart>(key) ?? currentCart.current;
      if (!mounted.current || drafts.current[id] !== draft) return;
      if (!snapshot?.items.some(item => String(item.product) === id)) { discard(id); return; }
      if (!valid(draft.value)) throw new Error("Quantities must be whole numbers between 1 and 500.");
      await queryClient.cancelQueries({ queryKey: key });
      if (!mounted.current) return;
      const response = await api.patch(`/cart/item/${id}`, { quantity: Number(draft.value) });
      publish(response.data.data.cart);
      // An edit made while this request ran has its own generation and survives.
      if (drafts.current[id] === draft) discard(id);
    });
    queued.current.set(id, { draft, promise });
    const settled = () => { if (queued.current.get(id)?.promise === promise) queued.current.delete(id); };
    promise.then(settled, settled);
    return promise;
  };

  const changeQuantity = (id: string, value: string) => {
    if (locked()) return;
    drafts.current[id] = { value }; syncDrafts(); cancelTimer(id);
    if (valid(value)) timers.current.set(id, setTimeout(() => {
      timers.current.delete(id); void save(id).catch(reportError);
    }, 600));
  };
  const commitQuantity = (id: string) => {
    if (locked()) return;
    cancelTimer(id);
    if (drafts.current[id] && valid(drafts.current[id].value)) void save(id).catch(reportError);
  };
  const deleteItems = async (id?: string) => {
    if (locked()) return;
    deleting.current = true; setDeleting(true);
    if (id) cancelTimer(id); else cancelTimers();
    try {
      await enqueue(async () => {
        if (!mounted.current) return;
        await queryClient.cancelQueries({ queryKey: key });
        if (!mounted.current) return;
        const response = await api.delete(id ? `/cart/item/${id}` : "/cart/clear");
        if (!mounted.current) return;
        if (id) { discard(id); publish(response.data.data.cart); }
        else {
          for (const productId of Object.keys(drafts.current)) discard(productId);
          // Clear succeeded even if the following refresh fails. Do not allow
          // cleared drafts to apply to a re-added instance of the same product.
          queryClient.setQueryData<ServerCart>(key, previous => previous ? { ...previous, items: [], totalAmount: 0 } : previous);
          await freshCart();
        }
      });
    } catch (error) { if (mounted.current || !isCancel(error)) reportError(error); }
    finally { deleting.current = false; if (mounted.current) setDeleting(false); }
  };
  const prepare = async () => {
    if (locked()) return null;
    preparing.current = true; setPreparing(true); cancelTimers();
    const failures = queue.current.failures;
    try {
      await queue.current.tail;
      if (queue.current.failures !== failures) throw queue.current.error;
      // Refresh membership before flushing so removed products are not replayed.
      await freshCart();
      const quantities = Object.fromEntries(Object.entries(drafts.current).map(([id, draft]) => [id, draft.value]));
      const snapshot = await prepareCheckout(quantities, id => save(id), freshCart);
      return mounted.current ? snapshot : null;
    } catch (error) {
      if (!mounted.current && isCancel(error)) return null;
      throw error;
    } finally { preparing.current = false; if (mounted.current) setPreparing(false); }
  };
  const resetDrafts = () => { cancelTimers(); drafts.current = {}; syncDrafts(); };

  // Query refreshes can reveal external removals; prune those draft generations.
  useEffect(() => { if (cart) prune(cart); }, [cart]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; cancelTimers(); freshRequest.current?.abort(); };
  }, []);

  return { localQty, changeQuantity, commitQuantity, deleteItems, prepare, resetDrafts,
    isPreparing, isDeleting, isLocked: isPreparing || isDeleting || disabled };
}
