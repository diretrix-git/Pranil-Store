interface CartLine {
  product: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
}
interface ServerCart {
  __v: number;
  items: CartLine[];
  totalAmount: number;
}
export interface CartConfirmation {
  cartVersion: number;
  items: CartLine[];
  totalAmount: number;
}

// Validate the entire draft first, serialize writes to the same cart, then
// capture exactly what the server will accept. Later refetches cannot alter it.
export async function prepareCheckout(
  quantities: Record<string, number | string>,
  saveQuantity: (id: string, quantity: number) => Promise<unknown>,
  fetchCart: () => Promise<ServerCart>,
): Promise<CartConfirmation> {
  const edits = Object.entries(quantities).map(([id, value]) => [id, Number(value)] as const);
  if (edits.some(([, quantity]) => !Number.isInteger(quantity) || quantity < 1 || quantity > 500)) {
    throw new Error("Quantities must be whole numbers between 1 and 500.");
  }
  for (const [id, quantity] of edits) await saveQuantity(id, quantity);
  const cart = await fetchCart();
  return {
    cartVersion: cart.__v,
    items: cart.items.map(item => ({ ...item })),
    totalAmount: cart.totalAmount,
  };
}
