import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import api from '../../api/axiosInstance';

export default function AdminMessagesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => { const res = await api.get('/contact'); return res.data.data?.messages ?? []; },
  });

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/contact/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries(['admin-messages']),
  });

  const messages = Array.isArray(data) ? data : [];
  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Messages</h1>
          {unread > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{unread} new</span>
          )}
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20"><p className="text-5xl mb-4">💬</p><p className="text-slate-400">No messages yet.</p></div>
        ) : (
          <motion.div variants={{ show: { transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="show"
            className="space-y-3">
            {messages.map((msg) => (
              <motion.div key={msg._id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${!msg.isRead ? 'border-violet-300 shadow-violet-100' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-slate-900">{msg.name}</span>
                      <span className="text-slate-400 text-sm">{msg.email}</span>
                      {msg.phone && <span className="text-slate-400 text-sm">{msg.phone}</span>}
                      {!msg.isRead && (
                        <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">New</span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-700 text-sm mb-2">{msg.subject}</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{msg.message}</p>
                    <p className="text-xs text-slate-400 mt-3">{new Date(msg.createdAt).toLocaleString()}</p>
                  </div>
                  {!msg.isRead && (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => markRead.mutate(msg._id)}
                      className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200 transition-colors">
                      Mark read
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
