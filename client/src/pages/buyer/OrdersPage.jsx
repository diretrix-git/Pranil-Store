import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import api from "../../api/axiosInstance";
import { formatRs } from "../../utils/formatCurrency";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-violet-100 text-violet-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const res = await api.get("/orders/my");
      return res.data.data?.orders ?? res.data.orders ?? res.data;
    },
  });

  const orders = Array.isArray(data) ? data : [];

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

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-5xl mb-4">📦</p>
            <p className="text-slate-400 text-lg">No orders yet.</p>
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
                    onClick={() =>
                      window.open(`/invoice/${order._id}`, "_blank")
                    }
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
