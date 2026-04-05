import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Truck, TrendingUp, Package, Users, MessageSquare } from 'lucide-react';
import api from '../../api/axiosInstance';

function StatCard({ icon: Icon, label, value, sub, color, bg, border }) {
  return (
    <div className={`bg-white rounded-xl border ${border ?? 'border-slate-200'} p-5 shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon size={18} className={color} strokeWidth={2} />
        </div>
      </div>
      <p className={`text-2xl font-black ${color} mb-0.5`}>{value}</p>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function QuickLink({ to, icon: Icon, label, desc }) {
  return (
    <Link to={to}
      className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-violet-200 hover:shadow-sm transition-all group">
      <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-violet-50 transition-colors">
        <Icon size={16} className="text-slate-500 group-hover:text-violet-600 transition-colors" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { data } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => { const res = await api.get('/admin/stats'); return res.data.data ?? {}; },
    refetchInterval: 30000,
  });

  const s = data ?? {};

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">B2B Marketplace overview</p>
      </div>

      {/* Alert row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={AlertTriangle} label="Low Stock" value={s.lowStockProducts ?? 0}
          sub="Products below 20 units"
          color="text-red-600" bg="bg-red-50" border="border-red-100" />
        <StatCard
          icon={Clock} label="Pending Orders" value={s.pendingOrders ?? 0}
          sub="Awaiting fulfillment"
          color="text-violet-600" bg="bg-violet-50" border="border-violet-100" />
        <StatCard
          icon={Truck} label="Active Vendors" value={s.totalVendors ?? 0}
          sub="Supplier partners"
          color="text-blue-600" bg="bg-blue-50" border="border-blue-100" />
        <StatCard
          icon={TrendingUp} label="Revenue" value={`$${Number(s.totalRevenue ?? 0).toFixed(0)}`}
          sub="Total fulfilled volume"
          color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Products', value: s.totalProducts ?? 0, color: 'text-slate-800' },
          { label: 'Total Orders',   value: s.totalOrders ?? 0,   color: 'text-slate-800' },
          { label: 'Buyers',         value: s.totalBuyers ?? 0,   color: 'text-slate-800' },
          { label: 'Unread Messages',value: s.unreadMessages ?? 0, color: s.unreadMessages > 0 ? 'text-red-600' : 'text-slate-800' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-2">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <QuickLink to="/admin/products"   icon={Package}       label="Add Product"    desc="Create new inventory item" />
          <QuickLink to="/admin/vendors"    icon={Truck}         label="Add Vendor"     desc="Register a new supplier" />
          <QuickLink to="/admin/categories" icon={Package}       label="Add Category"   desc="Manage product categories" />
          <QuickLink to="/admin/orders"     icon={Clock}         label="View Orders"    desc={`${s.pendingOrders ?? 0} pending`} />
          <QuickLink to="/admin/messages"   icon={MessageSquare} label="Messages"       desc={`${s.unreadMessages ?? 0} unread`} />
          <QuickLink to="/admin/users"      icon={Users}         label="Buyers"         desc={`${s.totalBuyers ?? 0} registered`} />
        </div>
      </div>
    </div>
  );
}
