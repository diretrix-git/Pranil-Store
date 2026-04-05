import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axiosInstance';
import { formatRs } from '../../utils/formatCurrency';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
const STATUS_STYLES = {
  pending:    'bg-amber-100 text-amber-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-violet-100 text-violet-700',
  completed:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
};

const DATE_FILTERS = [
  { label: 'All time',     value: 'all' },
  { label: 'Today',        value: 'today' },
  { label: 'Last 7 days',  value: '7d' },
  { label: 'Last 30 days', value: '30d' },
];

function isWithin(dateStr, filter) {
  if (filter === 'all') return true;
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  if (filter === 'today') return d.toDateString() === now.toDateString();
  if (filter === '7d')  return diffMs <= 7  * 86400000;
  if (filter === '30d') return diffMs <= 30 * 86400000;
  return true;
}

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [statusModal, setStatusModal] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [detailOrder, setDetailOrder] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => { const res = await api.get('/orders'); return res.data.data?.orders ?? []; },
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }) => api.patch(`/orders/${orderId}/status`, { status }),
    onSuccess: () => { queryClient.invalidateQueries(['admin-orders']); setStatusModal(null); },
  });

  const allOrders = Array.isArray(data) ? data : [];

  const orders = useMemo(() => {
    return allOrders.filter((o) => {
      const dateOk = isWithin(o.createdAt, dateFilter);
      const statusOk = statusFilter === 'all' || o.status === statusFilter;
      return dateOk && statusOk;
    });
  }, [allOrders, dateFilter, statusFilter]);

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">All Orders</h1>
            <p className="text-sm text-slate-500 mt-0.5">{orders.length} of {allOrders.length} orders · Click any row to view details</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Date filter */}
            <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
              {DATE_FILTERS.map((f) => (
                <button key={f.value} onClick={() => setDateFilter(f.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    dateFilter === f.value ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-violet-600'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-400">
              <option value="all">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <p className="text-4xl mb-3">🛒</p>
            <p className="text-slate-500">{allOrders.length === 0 ? 'No orders yet.' : 'No orders match the selected filters.'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Order #', 'Buyer Name', 'Buyer Phone', 'Items', 'Total', 'Status', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order._id} onClick={() => setDetailOrder(order)}
                      className="hover:bg-violet-50 transition-colors cursor-pointer">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">{order.orderNumber}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{order.buyerSnapshot?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{order.buyerSnapshot?.phone || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 text-center">{order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatRs(order.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setNewStatus(order.status); setStatusModal({ orderId: order._id, current: order.status }); }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition-colors whitespace-nowrap">
                            Update Status
                          </button>
                          <button onClick={() => window.open(`/invoice/${order._id}`, '_blank')}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors whitespace-nowrap">
                            Print Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      <AnimatePresence>
        {statusModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setStatusModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h2 className="text-lg font-black text-slate-900 mb-4">Update Order Status</h2>
              <div className="space-y-2 mb-6">
                {STATUS_OPTIONS.map((s) => (
                  <button key={s} onClick={() => setNewStatus(s)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${newStatus === s ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600 hover:border-violet-300'}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStatusModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => updateStatus.mutate({ orderId: statusModal.orderId, status: newStatus })}
                  disabled={updateStatus.isPending || newStatus === statusModal.current}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50">
                  {updateStatus.isPending ? 'Saving...' : 'Save'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {detailOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setDetailOrder(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-black text-slate-900">{detailOrder.orderNumber}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(detailOrder.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => setDetailOrder(null)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 font-bold">✕</button>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Buyer</p>
                <p className="font-semibold text-slate-800">{detailOrder.buyerSnapshot?.name ?? '—'}</p>
                <p className="text-sm text-slate-500">{detailOrder.buyerSnapshot?.phone || '—'}</p>
                <p className="text-sm text-slate-500">{detailOrder.buyerSnapshot?.email || '—'}</p>
              </div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Items Ordered</p>
                <div className="space-y-2">
                  {(detailOrder.items ?? []).map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.unit || 'pcs'} · {formatRs(item.price)} each</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">× {item.quantity}</p>
                        <p className="font-bold text-slate-900 text-sm">{formatRs(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center bg-violet-50 rounded-xl px-4 py-3 mb-5">
                <span className="font-bold text-slate-700">Total</span>
                <span className="text-xl font-black text-violet-700">{formatRs(detailOrder.totalAmount)}</span>
              </div>
              {detailOrder.notes && (
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3">{detailOrder.notes}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setDetailOrder(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">Close</button>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => window.open(`/invoice/${detailOrder._id}`, '_blank')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90">
                  Print Invoice
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
