import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import api from '../../api/axiosInstance';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => { const res = await api.get('/admin/stats'); return res.data; },
  });

  const stats = data?.data ?? data ?? {};

  const cards = [
    { icon: '👥', label: 'Total Users', value: stats.totalUsers ?? 0, color: 'text-blue-700', bg: 'bg-blue-50' },
    { icon: '🏪', label: 'Total Stores', value: stats.totalStores ?? 0, color: 'text-violet-700', bg: 'bg-violet-50' },
    { icon: '🛒', label: 'Total Orders', value: stats.totalOrders ?? 0, color: 'text-orange-700', bg: 'bg-orange-50' },
    { icon: '💰', label: 'Total Revenue', value: `$${Number(stats.totalRevenue ?? 0).toFixed(2)}`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Platform-wide overview.</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map(({ icon, label, value, color, bg }, i) => (
              <motion.div key={label} variants={fadeUp} transition={{ delay: i * 0.1 }}
                className={`${bg} rounded-2xl p-5 sm:p-6 border border-white shadow-sm`}>
                <p className="text-2xl sm:text-3xl mb-2">{icon}</p>
                <p className={`text-xl sm:text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div variants={{ show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { to: '/admin/users', icon: '👥', label: 'Manage Users', desc: 'Activate or deactivate accounts' },
            { to: '/admin/stores', icon: '🏪', label: 'Manage Stores', desc: 'View and control all stores' },
          ].map(({ to, icon, label, desc }) => (
            <motion.div key={to} variants={fadeUp} whileHover={{ y: -3 }}>
              <Link to={to} className="block bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:border-violet-200 transition-all group">
                <span className="text-3xl block mb-3">{icon}</span>
                <p className="font-bold text-slate-800 group-hover:text-violet-600 transition-colors">{label}</p>
                <p className="text-xs text-slate-400 mt-1">{desc}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
