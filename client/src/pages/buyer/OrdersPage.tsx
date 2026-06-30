import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import api from "../../api/axiosInstance";
import { formatRs } from "../../utils/formatCurrency";
import { useAuth } from "../../context/AuthContext";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-violet-100 text-violet-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const res = await api.get("/orders/my");
      return res.data.data?.orders ?? res.data.orders ?? res.data;
    },
    // Don't fire until auth is ready — prevents 401 on direct URL navigation
    enabled: !loading && !!user,
    staleTime: 30_000,
    retry: 2,
  });

  const orders = Array.isArray(data) ? data : [];
  const showSkeleton = loading || (isLoading && !!user);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-black text-slate-900 mb-6"
        >
          My Orders
        </motion.h1>

        {showSkeleton ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 border border-indigo-100">
              <span className="text-4xl">📦</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No orders yet</h2>
            <p className="text-slate-400 text-sm mb-6 max-w-xs">
              Once you place an order, you'll be able to track it and view invoices here.
            </p>
            <a
              href="/"
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-opacity shadow-md shadow-violet-200"
            >
              Start Shopping
            </a>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-slate-900 text-sm">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black text-slate-900">
                    {formatRs(order.totalAmount)}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => navigate(`/invoice/${order._id}`)}
                    className="text-xs font-semibold px-4 py-2 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200 transition-colors"
                  >
                    View Invoice
                  </motion.button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
