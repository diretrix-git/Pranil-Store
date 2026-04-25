import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar";
import api from "../../api/axiosInstance";
import { formatRs } from "../../utils/formatCurrency";

export default function CartPage() {
  const queryClient = useQueryClient();
  const [priceWarning, setPriceWarning] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [notes, setNotes] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [orderError, setOrderError] = useState("");
  const [localQty, setLocalQty] = useState<Record<string, number | string>>({});

  const { data: cartData, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await api.get("/cart");
      const payload = res.data.data ?? res.data;
      if (payload.priceChanged) setPriceWarning(true);
      return payload.cart ?? payload;
    },
  });

  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const updateQty = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) => api.patch(`/cart/item/${productId}`, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
  const removeItem = useMutation({
    mutationFn: (productId: string) => api.delete(`/cart/item/${productId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
  const clearCartMutation = useMutation({
    mutationFn: () => api.delete("/cart/clear"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
  const placeOrder = useMutation({
    mutationFn: () => api.post("/orders", { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setShowCheckout(false);
      setNotes("");
      setSuccessMsg("🎉 Order placed successfully! You can view it in My Orders.");
      setTimeout(() => setSuccessMsg(""), 6000);
    },
    onError: (err: any) => { setOrderError(err.response?.data?.message ?? "Failed to place order."); setShowCheckout(false); },
  });

  const handleQtyChange = useCallback((pid: string, val: string) => {
    setLocalQty((prev) => ({ ...prev, [pid]: val }));
    // Debounce the API call — fires 600ms after user stops typing
    if (debounceRef.current[pid]) clearTimeout(debounceRef.current[pid]);
    const qty = Number(val);
    if (qty >= 1) {
      debounceRef.current[pid] = setTimeout(() => {
        updateQty.mutate({ productId: pid, quantity: qty });
      }, 600);
    }
  }, [updateQty]);

  const commitQty = useCallback((pid: string, val: string | number) => {
    // On blur/Enter: cancel pending debounce and fire immediately
    if (debounceRef.current[pid]) clearTimeout(debounceRef.current[pid]);
    const qty = Number(val);
    if (qty >= 1) updateQty.mutate({ productId: pid, quantity: qty });
  }, [updateQty]);

  const flushAndCheckout = useCallback(async () => {
    // Cancel all pending debounces and flush any dirty quantities to the server
    const pending = Object.entries(debounceRef.current);
    if (pending.length > 0) {
      pending.forEach(([pid, timer]) => {
        clearTimeout(timer);
        delete debounceRef.current[pid];
      });
      // Fire all dirty qty updates in parallel and wait for them
      const dirtyPids = Object.keys(localQty);
      if (dirtyPids.length > 0) {
        await Promise.all(
          dirtyPids.map((pid) => {
            const qty = Number(localQty[pid]);
            if (qty >= 1) return api.patch(`/cart/item/${pid}`, { quantity: qty });
            return Promise.resolve();
          })
        );
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
      }
    }
    setShowCheckout(true);
  }, [localQty, queryClient]);
  const items: any[] = (cartData as any)?.items ?? [];
  // Compute total from localQty so it stays in sync with what the user typed
  const total: number = items.length > 0
    ? items.reduce((sum: number, item: any) => {
        const pid = String(item.product?._id ?? item.product ?? item.productId);
        return sum + Number(item.price) * Number(localQty[pid] !== undefined ? localQty[pid] : item.quantity);
      }, 0)
    : ((cartData as any)?.totalAmount ?? 0);
  const getQty = (pid: string, fallback: number) => localQty[pid] !== undefined ? localQty[pid] : fallback;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl sm:text-3xl font-black text-slate-900 mb-6">Your Cart</motion.h1>
        {priceWarning && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3 mb-5">⚠️ Some prices changed since you added items. Please review before ordering.</motion.div>}
        <AnimatePresence>
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-4 mb-5 flex items-start gap-3">
              <span className="text-lg shrink-0">✅</span>
              <div><p className="font-semibold">{successMsg}</p><p className="text-xs text-green-600 mt-0.5">Check <a href="/orders" className="underline font-semibold">My Orders</a> to view your order details and invoice.</p></div>
            </motion.div>
          )}
        </AnimatePresence>
        {orderError && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">⚠️ {orderError}</motion.div>}
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : items.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20"><p className="text-5xl mb-4">🛒</p><p className="text-slate-400 text-lg">Your cart is empty.</p></motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-5">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>{["Product","Unit Price","Qty","Subtotal",""].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {items.map((item) => {
                      const pid = String(item.product?._id ?? item.product ?? item.productId);
                      const qty = getQty(pid, item.quantity);
                      return (
                        <motion.tr key={pid} exit={{ opacity: 0, x: -20 }} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4 font-medium text-slate-800">{item.name ?? "Product"}</td>
                          <td className="px-4 py-4 text-slate-600">{formatRs(item.price)}</td>
                          <td className="px-4 py-4">
                            <input type="number" min={1} value={qty} onChange={(e) => handleQtyChange(pid, e.target.value)} onBlur={(e) => commitQty(pid, e.target.value)} onKeyDown={(e) => e.key === "Enter" && commitQty(pid, qty)} className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all" />
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-900">{formatRs(Number(item.price) * Number(qty))}</td>
                          <td className="px-4 py-4"><button onClick={() => removeItem.mutate(pid)} className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors">Remove</button></td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => clearCartMutation.mutate()} className="text-sm text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 px-4 py-2 rounded-xl transition-all">Clear Cart</motion.button>
              <div className="text-right w-full sm:w-auto">
                <p className="text-xl sm:text-2xl font-black text-slate-900 mb-3">Total: <span className="text-violet-600">{formatRs(total)}</span></p>
                <motion.button whileTap={{ scale: 0.97 }} onClick={flushAndCheckout} className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-opacity shadow-md shadow-violet-200">Checkout →</motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      <AnimatePresence>
        {showCheckout && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowCheckout(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-black text-slate-900 mb-5">Confirm Order</h2>
              <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-2">
                {items.map((item) => {
                  const pid = String(item.product?._id ?? item.product ?? item.productId);
                  const qty = Number(getQty(pid, item.quantity));
                  return <div key={pid} className="flex justify-between text-sm"><span className="text-slate-700">{item.name} <span className="text-slate-400">× {qty}</span></span><span className="font-semibold text-slate-900">{formatRs(Number(item.price) * qty)}</span></div>;
                })}
                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between font-black text-slate-900"><span>Total</span><span className="text-violet-600">{formatRs(items.reduce((sum, item) => { const pid = String(item.product?._id ?? item.product ?? item.productId); return sum + Number(item.price) * Number(getQty(pid, item.quantity)); }, 0))}</span></div>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Order Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any special instructions..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCheckout(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => placeOrder.mutate()} disabled={placeOrder.isPending} className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md shadow-violet-200">
                  {placeOrder.isPending ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Placing...</span> : "Place Order"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
