import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useNotificationStore from "../../store/notificationStore";
import { formatRs } from "../../utils/formatCurrency";
import { AppNotification, OrderNotification, MessageNotification } from "../../types";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, markAllRead } = useNotificationStore();

  useEffect(() => { if (open) markAllRead(); }, [open, markAllRead]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, onClose]);

  return (
    <>
      <AnimatePresence>
        {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.div ref={panelRef} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="font-black text-slate-900 text-lg">Notifications</h2>
                {notifications.length > 0 && <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">{notifications.length}</span>}
              </div>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors font-bold">✕</button>
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
