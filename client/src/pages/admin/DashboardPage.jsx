import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import api from '../../api/axiosInstance';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AdminDashboardPage() {
  const { data } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => { const res = await api.get('/admin/stats'); return res.data.data ?? {}; },
  });

  const stats = data ?? {};

  const quickActions = [
    { to: '/admin/products',   icon: '📦', label: 'Add Product',   desc: 'Create and manage products', accent: 'from-violet-500 to-indigo-500' },
    { to: '/admin/categories', icon: '🏷️', label: 'Add Category',  desc: 'Manage product categories',  accent: 'from-purple-500 to-violet-500' },
    { to: '/admin/orders',     icon: '🛒', label: 'View Orders',   desc: 'Manage all buyer orders',    accent: 'from-orange-500 to-amber-500' },
    { to: '/admin/messages',   icon: '💬', label: 'Messages',      desc: `${stats.unreadMessages ?? 0} unread`, accent: 'from-emerald-500 to-teal-500', badge: stats.unreadMessages },
    { to: '/admin/users',      icon: '👥', label: 'Buyers',        desc: `${stats.totalBuyers ?? 0} registered`, accent: 'from-blue-500 to-cyan-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your marketplace.</p>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={{ show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: '📦', label: 'Products',  value: stats.totalProducts ?? 0,  color: 'text-violet-700', bg: 'bg-violet-50' },
            { icon: '🛒', label: 'Orders',    value: stats.totalOrders ?? 0,    color: 'text-orange-700', bg: 'bg-orange-50' },
            { icon: '👥', label: 'Buyers',    value: stats.totalBuyers ?? 0,    color: 'text-blue-700',   bg: 'bg-blue-50' },
            { icon: '💰', label: 'Revenue',   value: `$${Number(stats.totalRevenue ?? 0).toFixed(0)}`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
          ].map(({ icon, label, value, color, bg }, i) => (
            <motion.div key={label} variants={fadeUp} transition={{ delay: i * 0.08 }}
              className={`${bg} rounded-2xl p-4 sm:p-5 border border-white shadow-sm`}>
              <p className="text-2xl mb-1">{icon}</p>
              <p className={`text-xl sm:text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick actions */}
        <motion.div variants={{ show: { transition: { staggerChildren: 0.07 } } }} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map(({ to, icon, label, desc, accent, badge }) => (
            <motion.div key={to} variants={fadeUp} whileHover={{ y: -3 }}>
              <Link to={to}
                className="block bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:border-violet-200 transition-all group relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${accent} rounded-l-2xl`} />
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{icon}</span>
                  {badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>
                  )}
                </div>
                <p className="font-bold text-slate-800 group-hover:text-violet-600 transition-colors mt-3">{label}</p>
                <p className="text-xs text-slate-400 mt-1">{desc}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
