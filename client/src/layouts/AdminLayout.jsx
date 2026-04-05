import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Truck, ShoppingCart,
  FileText, MessageSquare, Users, LogOut, Menu, X, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import useNotificationStore from '../store/notificationStore';
import useAdminNotifications from '../hooks/useAdminNotifications';
import NotificationsPanel from '../components/admin/NotificationsPanel';

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { to: '/admin/products',   icon: Package,  label: 'Products' },
      { to: '/admin/categories', icon: Tag,       label: 'Categories' },
      { to: '/admin/vendors',    icon: Truck,     label: 'Vendors' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { to: '/admin/messages', icon: MessageSquare, label: 'Messages' },
      { to: '/admin/users',    icon: Users,          label: 'Buyers' },
    ],
  },
];

function Sidebar({ onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-60">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <NavLink to="/admin/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🛍️</span>
          <span className="font-black text-base bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            MarketHub
          </span>
        </NavLink>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-violet-50 text-violet-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }>
                  <Icon size={16} strokeWidth={isActive => isActive ? 2.5 : 2} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-100">
        <button onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all">
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  useAdminNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 h-full z-50 lg:hidden">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <Menu size={20} />
            </button>
            <span className="text-sm font-semibold text-slate-500 hidden sm:block">Admin Panel</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Bell */}
            <button onClick={() => setPanelOpen((v) => !v)}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Notifications">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <NotificationsPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}
