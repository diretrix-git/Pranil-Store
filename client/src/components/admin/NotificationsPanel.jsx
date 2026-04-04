import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useNotificationStore from '../../store/notificationStore';

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsPanel({ open, onClose }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const { notifications, unreadCount, markAllRead } = useNotificationStore();

  // Mark all read when panel opens
  useEffect(() => {
    if (open) markAllRead();
  }, [open, markAllRead]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Slide-in panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <h2 className="font-black text-slate-900 text-lg">Notifications</h2>
                {notifications.length > 0 && (
                  <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </div>
              <button onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                ✕
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <p className="text-4xl mb-3">🔔</p>
                  <p className="text-slate-400 text-sm">No notifications yet.</p>
                  <p className="text-slate-300 text-xs mt-1">New orders will appear here in real time.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((n, i) => (
                    <motion.div
                      key={`${n.orderId}-${i}`}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="px-5 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{n.orderNumber}</p>
                          <p className="text-xs text-slate-500">{n.buyerName} · {n.buyerPhone || 'no phone'}</p>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{timeAgo(n.receivedAt)}</span>
                      </div>

                      {/* Items */}
                      <div className="bg-slate-50 rounded-lg px-3 py-2 mb-3 space-y-1">
                        {n.items?.map((item, j) => (
                          <div key={j} className="flex justify-between text-xs text-slate-600">
                            <span>{item.name} × {item.quantity}</span>
                            <span className="font-medium">${Number(item.subtotal).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs font-bold text-slate-900 pt-1 border-t border-slate-200 mt-1">
                          <span>Total</span>
                          <span>${Number(n.totalAmount).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => { navigate('/admin/orders'); onClose(); }}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition-colors">
                          View Order
                        </button>
                        <button
                          onClick={() => window.open(`/invoice/${n.orderId}`, '_blank')}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors">
                          Print Invoice
                        </button>
                      </div>
                    </motion.div>
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
