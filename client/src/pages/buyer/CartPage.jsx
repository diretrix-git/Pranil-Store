import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar";
import api from "../../api/axiosInstance";

export default function CartPage() {
  const queryClient = useQueryClient();
  const [priceWarning, setPriceWarning] = useState(false);
  const [orderError, setOrderError] = useState("");

  const { data: cartData, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await api.get("/cart");
      // Response: { status, data: { cart, priceChanged }, message }
      const payload = res.data.data ?? res.data;
      if (payload.priceChanged) setPriceWarning(true);
      return payload.cart ?? payload;
    },
  });

  const updateQty = useMutation({
    mutationFn: ({ productId, quantity }) =>
      api.patch(`/cart/item/${productId}`, { quantity }),
    onSuccess: () => queryClient.invalidateQueries(["cart"]),
  });

  const removeItem = useMutation({
    mutationFn: (productId) => api.delete(`/cart/item/${productId}`),
    onSuccess: () => queryClient.invalidateQueries(["cart"]),
  });

  const clearCart = useMutation({
    mutationFn: () => api.delete("/cart/clear"),
    onSuccess: () => queryClient.invalidateQueries(["cart"]),
  });

  const placeOrder = useMutation({
    mutationFn: () => api.post("/orders"),
    onSuccess: (res) => {
      const order = res.data.data?.order ?? res.data.order ?? res.data;
      queryClient.invalidateQueries(["cart"]);
      window.open(`/invoice/${order._id}`, "_blank");
    },
    onError: (err) =>
      setOrderError(err.response?.data?.message ?? "Failed to place order."),
  });

  const items = cartData?.items ?? [];
  const total = cartData?.totalAmount ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-black text-slate-900 mb-6"
        >
          Your Cart
        </motion.h1>

        {priceWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3 mb-5"
          >
            ⚠️ Some prices changed since you added items. Please review before
            ordering.
          </motion.div>
        )}
        {orderError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5"
          >
            ⚠️ {orderError}
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-5xl mb-4">🛒</p>
            <p className="text-slate-400 text-lg">Your cart is empty.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-5">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Product", "Price", "Qty", "Subtotal", ""].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {items.map((item) => {
                      const pid =
                        item.product?._id ?? item.product ?? item.productId;
                      return (
                        <motion.tr
                          key={String(pid)}
                          exit={{ opacity: 0, x: -20 }}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-4 font-medium text-slate-800">
                            {item.name ?? "Product"}
                          </td>
                          <td className="px-4 py-4 text-slate-600">
                            ${Number(item.price).toFixed(2)}
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                updateQty.mutate({
                                  productId: pid,
                                  quantity: Number(e.target.value),
                                })
                              }
                              className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                            />
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-900">
                            ${(Number(item.price) * item.quantity).toFixed(2)}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => removeItem.mutate(pid)}
                              className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
                            >
                              Remove
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3 mb-5">
              {items.map((item) => {
                const pid = item.product?._id ?? item.product ?? item.productId;
                return (
                  <div
                    key={String(pid)}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <p className="font-semibold text-slate-800 text-sm">
                        {item.name ?? "Product"}
                      </p>
                      <button
                        onClick={() => removeItem.mutate(pid)}
                        className="text-red-500 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Qty:</span>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateQty.mutate({
                              productId: pid,
                              quantity: Number(e.target.value),
                            })
                          }
                          className="w-14 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                        />
                      </div>
                      <p className="font-bold text-slate-900">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => clearCart.mutate()}
                className="text-sm text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 px-4 py-2 rounded-xl transition-all"
              >
                Clear Cart
              </motion.button>
              <div className="text-right w-full sm:w-auto">
                <p className="text-xl sm:text-2xl font-black text-slate-900 mb-3">
                  Total:{" "}
                  <span className="text-violet-600">
                    ${Number(total).toFixed(2)}
                  </span>
                </p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => placeOrder.mutate()}
                  disabled={placeOrder.isPending}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md shadow-violet-200"
                >
                  {placeOrder.isPending ? "Placing Order..." : "Place Order →"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
