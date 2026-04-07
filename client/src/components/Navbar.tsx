import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useClerk, UserButton } from "@clerk/react";
import { useAuth } from "../context/AuthContext";
import useNotificationStore from "../store/notificationStore";
import useAdminNotifications from "../hooks/useAdminNotifications";
import api from "../api/axiosInstance";
import { formatRs } from "../utils/formatCurrency";
import { AppNotification, OrderNotification, MessageNotification } from "../types";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { notifications, markAllRead } = useNotificationStore();

  useEffect(() => { if (open) markAllRead(); }, [open, markAllRead]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <>
      <AnimatePresence>
        {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="font-black text-slate-900 text-lg">Notifications</h2>
                {notifications.length > 0 && <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">{notifications.length}</span>}
              </div>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-lg font-bold">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <p className="text-4xl mb-3">🔔</p>
                  <p className="text-slate-400 text-sm">No notifications yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((n: AppNotification, i: number) => (
                    <div key={i} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                      {n.type === "order" ? (
                        <>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-xs bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded">Order</span>
                                <p className="font-bold text-slate-900 text-sm">{(n as OrderNotification).orderNumber}</p>
                              </div>
                              <p className="text-xs text-slate-500">{(n as OrderNotification).buyerName}</p>
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">{timeAgo(n.receivedAt)}</span>
                          </div>
                          <div className="bg-slate-50 rounded-lg px-3 py-2 mb-3 space-y-1">
                            {(n as OrderNotification).items?.map((item, j) => (
                              <div key={j} className="flex justify-between text-xs text-slate-600">
                                <span>{item.name} × {item.quantity}</span>
                                <span className="font-medium">{formatRs(item.subtotal)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-xs font-bold text-slate-900 pt-1 border-t border-slate-200 mt-1">
                              <span>Total</span>
                              <span>{formatRs((n as OrderNotification).totalAmount)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { navigate("/admin/orders"); onClose(); }} className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition-colors">View Order</button>
                            <button onClick={() => window.open(`/invoice/${(n as OrderNotification).orderId}`, "_blank")} className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors">Print Invoice</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Message</span>
                                <p className="font-bold text-slate-900 text-sm">{(n as MessageNotification).name}</p>
                              </div>
                              <p className="text-xs text-slate-500">{(n as MessageNotification).email}</p>
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">{timeAgo(n.receivedAt)}</span>
                          </div>
                          <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 mb-3 line-clamp-2">{(n as MessageNotification).subject}</p>
                          <button onClick={() => { navigate("/admin/messages"); onClose(); }} className="w-full py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors">View Message</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AdminNotificationBell() {
  useAdminNotifications();
  const [panelOpen, setPanelOpen] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  return (
    <>
      <button type="button" onClick={() => setPanelOpen((v) => !v)} className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Notifications">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      <NotificationsPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: cartData } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await api.get("/cart");
      const payload = res.data.data ?? res.data;
      return payload.cart ?? payload;
    },
    enabled: user?.role === "buyer",
    staleTime: 30000,
  });
  const cartProductCount = (cartData as any)?.items?.length ?? 0;

  const navLinks =
    user?.role === "buyer"
      ? [
          { to: "/", label: "Home", badge: 0 },
          { to: "/cart", label: "🛒 Cart", badge: cartProductCount },
          { to: "/orders", label: "My Orders", badge: 0 },
          { to: "/contact", label: "Contact", badge: 0 },
        ]
      : user?.role === "admin"
      ? []
      : [
          { to: "/", label: "Home", badge: 0 },
          { to: "/about", label: "About", badge: 0 },
          { to: "/contact", label: "Contact", badge: 0 },
        ];

  const roleBadge =
    user?.role === "buyer"
      ? { label: "🛒 Buyer", cls: "bg-blue-50 text-blue-600 border-blue-200" }
      : user?.role === "admin"
      ? { label: "⚡ Admin", cls: "bg-red-50 text-red-600 border-red-200" }
      : null;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <motion.span whileHover={{ rotate: 15 }} className="text-2xl">🛍️</motion.span>
            <span className="text-xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">MarketHub</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, badge }) => (
              <Link key={to} to={to} className="relative px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-violet-600 hover:bg-violet-50 transition-all">
                {label}
                {badge > 0 && <span className="absolute -top-0.5 -right-0.5 bg-violet-600 text-white text-xs font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">{badge > 9 ? "9+" : badge}</span>}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user?.role === "admin" && <AdminNotificationBell />}
            {user ? (
              <div className="flex items-center gap-3">
                {roleBadge && <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${roleBadge.cls}`}>{roleBadge.label}</span>}
                <span className="text-sm text-slate-600 font-medium hidden lg:block">{user.name}</span>
                {/* Clerk's UserButton handles profile + sign out */}
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <>
                <Link to="/sign-in" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">Login</Link>
                <Link to="/sign-up" className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-opacity shadow-sm shadow-violet-200">Sign Up</Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            {user?.role === "admin" && <AdminNotificationBell />}
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              <span className="text-xl">{menuOpen ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-t border-slate-100 bg-white overflow-hidden">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(({ to, label, badge }) => (
                <Link key={to} to={to} onClick={() => setMenuOpen(false)} className="relative block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-violet-600 hover:bg-violet-50 transition-all">
                  {label}
                  {badge > 0 && <span className="ml-1.5 bg-violet-600 text-white text-xs font-black px-1.5 py-0.5 rounded-full">{badge > 9 ? "9+" : badge}</span>}
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-100 mt-2">
                {user ? (
                  <div className="px-3 py-2 flex items-center gap-3">
                    {roleBadge && <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${roleBadge.cls}`}>{roleBadge.label}</span>}
                    <span className="text-sm text-slate-600 font-medium">{user.name}</span>
                    <UserButton afterSignOutUrl="/" />
                  </div>
                ) : (
                  <>
                    <Link to="/sign-in" onClick={() => setMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">Login</Link>
                    <Link to="/sign-up" onClick={() => setMenuOpen(false)} className="block mt-1 px-3 py-2.5 rounded-xl text-sm font-semibold text-white text-center bg-gradient-to-r from-violet-600 to-indigo-600">Sign Up Free</Link>
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
