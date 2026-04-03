import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = user?.role === 'buyer'
    ? [{ to: '/', label: 'Home' }, { to: '/cart', label: '🛒 Cart' }, { to: '/orders', label: 'My Orders' }]
    : user?.role === 'seller'
    ? [{ to: '/seller/dashboard', label: 'Dashboard' }, { to: '/seller/products', label: 'Products' }, { to: '/seller/orders', label: 'Orders' }, { to: '/seller/suppliers', label: 'Suppliers' }, { to: '/seller/settings', label: 'Settings' }]
    : user?.role === 'superadmin'
    ? [{ to: '/admin/dashboard', label: 'Dashboard' }, { to: '/admin/users', label: 'Users' }, { to: '/admin/stores', label: 'Stores' }]
    : [{ to: '/', label: 'Home' }, { to: '/about', label: 'About' }];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <motion.span whileHover={{ rotate: 15 }} className="text-2xl">🛍️</motion.span>
            <span className="text-xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              MarketHub
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-violet-600 hover:bg-violet-50 transition-all">
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Role badge */}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  user.role === 'buyer' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                  user.role === 'seller' ? 'bg-violet-50 text-violet-600 border-violet-200' :
                  'bg-red-50 text-red-600 border-red-200'
                }`}>
                  {user.role === 'buyer' ? '🛒 Buyer' : user.role === 'seller' ? '🏪 Seller' : '⚡ Admin'}
                </span>
                <span className="text-sm text-slate-600 font-medium hidden lg:block">{user.name}</span>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleLogout}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-opacity shadow-sm shadow-violet-200">
                  Logout
                </motion.button>
              </div>
            ) : (
              <>
                <Link to="/login" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">
                  Login
                </Link>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Link to="/register"
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-opacity shadow-sm shadow-violet-200">
                    Sign Up
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
            <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-100 bg-white overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(({ to, label }) => (
                <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-violet-600 hover:bg-violet-50 transition-all">
                  {label}
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-100 mt-2">
                {user ? (
                  <>
                    <div className="px-3 py-2 flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        user.role === 'buyer' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        user.role === 'seller' ? 'bg-violet-50 text-violet-600 border-violet-200' :
                        'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {user.role === 'buyer' ? '🛒 Buyer' : user.role === 'seller' ? '🏪 Seller' : '⚡ Admin'}
                      </span>
                      <span className="text-sm text-slate-600 font-medium">{user.name}</span>
                    </div>
                    <button onClick={handleLogout}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                      Login
                    </Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)}
                      className="block mt-1 px-3 py-2.5 rounded-xl text-sm font-semibold text-white text-center bg-gradient-to-r from-violet-600 to-indigo-600">
                      Sign Up Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
