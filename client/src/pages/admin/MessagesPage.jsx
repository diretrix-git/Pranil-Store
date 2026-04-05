import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axiosInstance';

const DATE_FILTERS = [
  { label: 'All time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
];

function isWithin(dateStr, filter) {
  if (filter === 'all') return true;
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  if (filter === 'today') {
    return d.toDateString() === now.toDateString();
  }
  if (filter === '7d') return diffMs <= 7 * 86400000;
  if (filter === '30d') return diffMs <= 30 * 86400000;
  return true;
}

// Render message preserving line breaks / paragraphs
function MessageBody({ text }) {
  return (
    <div className="space-y-3">
      {text.split(/\n\n+/).map((para, i) => (
        <p key={i} className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {para}
        </p>
      ))}
    </div>
  );
}

export default function AdminMessagesPage() {
  const queryClient = useQueryClient();
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const res = await api.get('/contact');
      return res.data.data?.messages ?? [];
    },
  });

  const markRead = useMutation({
    mutationFn: (id) => api.patch(`/contact/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries(['admin-messages']),
  });

  const allMessages = Array.isArray(data) ? data : [];
  const messages = useMemo(
    () => allMessages.filter((m) => isWithin(m.createdAt, dateFilter)),
    [allMessages, dateFilter]
  );
  const unread = allMessages.filter((m) => !m.isRead).length;

  const openMessage = (msg) => {
    setSelectedMsg(msg);
    if (!msg.isRead) markRead.mutate(msg._id);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Messages</h1>
            {unread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {unread} new
              </span>
            )}
          </div>

          {/* Date filter */}
          <div className="flex gap-2 flex-wrap">
            {DATE_FILTERS.map((f) => (
              <button key={f.value} onClick={() => setDateFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  dateFilter === f.value
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-violet-300 hover:text-violet-600'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">💬</p>
            <p className="text-slate-400">
              {dateFilter === 'all' ? 'No messages yet.' : 'No messages in this period.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <button key={msg._id} onClick={() => openMessage(msg)}
                className={`w-full text-left bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                  !msg.isRead ? 'border-violet-300 shadow-violet-50' : 'border-slate-200'
                }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-slate-900 text-sm">{msg.name}</span>
                      <span className="text-slate-400 text-xs">{msg.email}</span>
                      {msg.phone && <span className="text-slate-400 text-xs">{msg.phone}</span>}
                      {!msg.isRead && (
                        <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">New</span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-700 text-sm truncate">{msg.subject}</p>
                    <p className="text-slate-400 text-xs mt-1 truncate">{msg.message}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs text-slate-300">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Message detail modal */}
      <AnimatePresence>
        {selectedMsg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setSelectedMsg(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              {/* Modal header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex-1 min-w-0 pr-4">
                  <h2 className="text-lg font-black text-slate-900 leading-tight">{selectedMsg.subject}</h2>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span className="font-semibold text-slate-700 text-sm">{selectedMsg.name}</span>
                    <span className="text-slate-400 text-xs">{selectedMsg.email}</span>
                    {selectedMsg.phone && <span className="text-slate-400 text-xs">{selectedMsg.phone}</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(selectedMsg.createdAt).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => setSelectedMsg(null)}
                  className="shrink-0 text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors font-bold">
                  ✕
                </button>
              </div>

              {/* Message body — preserves paragraphs */}
              <div className="bg-slate-50 rounded-xl p-4 mb-5">
                <MessageBody text={selectedMsg.message} />
              </div>

              <button onClick={() => setSelectedMsg(null)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
