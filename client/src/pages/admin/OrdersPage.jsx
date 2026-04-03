import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import api from '../../api/axiosInstance';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
const STATUS_STYLES = {
  pending:    'bg-amber-100 text-amber-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-violet-100 text-violet-700',
  completed:  'bg-green-100 text-green-700',
  cancelled:  'bg-red-100 text-red-600',
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => { const res = await api.get('/orders'); return res.data.data?.orders ?? []; },
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }) => api.patch(`/orders/${orderId}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries(['admin-orders']),
  });

  const orders = Array.isArray(data) ? data : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-black text-slate-900 mb-6">All Orders</motion.h1>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20"><p className="text-5xl mb-4">🛒</p><p className="text-slate-400">No orders yet.</p></div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>{['Order #', 'Date', 'Buyer', 'Items', 'Total', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-600">{order.buyerSnapshot?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500 text-center">{order.items?.length ?? 0}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">${Number(order.totalAmount).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <select value={order.status}
                          onChange={(e) => updateStatus.mutate({ orderId: order._id, status: e.target.value })}
                          className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 focus:ring-2 focus:ring-violet-400 cursor-pointer ${STATUS_STYLES[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => window.open(`/invoice/${order._id}`, '_blank')}
                          className="text-violet-600 hover:text-violet-800 text-xs font-semibold">Invoice</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
