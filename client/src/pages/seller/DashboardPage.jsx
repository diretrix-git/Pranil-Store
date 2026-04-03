import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import api from "../../api/axiosInstance";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function StatCard({ icon, label, value, color, bg, delay }) {
  return (
    <motion.div
      variants={fadeUp}
      transition={{ delay }}
      className={`${bg} rounded-2xl p-6 border border-white shadow-sm`}
    >
      <p className="text-3xl mb-2">{icon}</p>
      <p className={`text-2xl sm:text-3xl font-black ${color}`}>{value}</p>
      <p className="text-sm font-medium text-slate-500 mt-1">{label}</p>
    </motion.div>
  );
}

export default function SellerDashboardPage() {
  const { data: ordersData } = useQuery({
    queryKey: ["store-orders"],
    queryFn: async () => {
      const res = await api.get("/orders/store");
      return res.data;
    },
  });
  const { data: productsData } = useQuery({
    queryKey: ["seller-products"],
    queryFn: async () => {
      const res = await api.get("/products");
      return res.data;
    },
  });

  const orders = ordersData?.data?.orders ?? ordersData?.orders ?? [];
  const products = productsData?.data?.products ?? productsData?.products ?? [];
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + (o.totalAmount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Seller Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Here's your store overview.</p>
        </motion.div>

        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <StatCard
            icon="📦"
            label="Total Products"
            value={products.length}
            color="text-violet-700"
            bg="bg-violet-50"
            delay={0}
          />
          <StatCard
            icon="🛒"
            label="Total Orders"
            value={orders.length}
            color="text-indigo-700"
            bg="bg-indigo-50"
            delay={0.1}
          />
          <StatCard
            icon="💰"
            label="Total Revenue"
            value={`$${revenue.toFixed(2)}`}
            color="text-emerald-700"
            bg="bg-emerald-50"
            delay={0.2}
          />
        </motion.div>

        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            {
              to: "/seller/products",
              icon: "📦",
              label: "Products",
              desc: "Manage inventory",
            },
            {
              to: "/seller/orders",
              icon: "🛒",
              label: "Orders",
              desc: "View & fulfill orders",
            },
            {
              to: "/seller/suppliers",
              icon: "🏭",
              label: "Suppliers",
              desc: "Manage suppliers",
            },
            {
              to: "/seller/settings",
              icon: "⚙️",
              label: "Store Settings",
              desc: "Edit store info",
            },
          ].map(({ to, icon, label, desc }) => (
            <motion.div key={to} variants={fadeUp} whileHover={{ y: -3 }}>
              <Link
                to={to}
                className="block bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:shadow-md hover:border-violet-200 transition-all group"
              >
                <span className="text-2xl sm:text-3xl block mb-2">{icon}</span>
                <p className="font-bold text-slate-800 group-hover:text-violet-600 transition-colors text-sm sm:text-base">
                  {label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                  {desc}
                </p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
