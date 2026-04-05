import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axiosInstance';

const ICONS = ['📦','💻','👕','🍎','📚','🏠','⚽','🎮','💄','🔧','🚗','🌿'];

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '📦', description: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const res = await api.get('/categories'); return res.data.data?.categories ?? []; },
  });
  const categories = Array.isArray(data) ? data : [];

  const createMutation = useMutation({
    mutationFn: () => api.post('/categories', form),
    onSuccess: () => { queryClient.invalidateQueries(['categories']); setShowModal(false); },
    onError: (err) => setFormError(err.response?.data?.message ?? 'Failed to create category.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['categories']); setDeleteId(null); },
  });

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Categories</h1>
            <p className="text-sm text-slate-500 mt-0.5">{categories.length} categories</p>
          </div>
          <button onClick={() => { setForm({ name: '', icon: '📦', description: '' }); setFormError(''); setShowModal(true); }}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 shadow-sm">
            + Add Category
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <p className="text-4xl mb-3">🏷️</p>
            <p className="text-slate-500">No categories yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div key={cat._id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{cat.icon}</span>
                  <button onClick={() => setDeleteId(cat._id)}
                    className="text-slate-300 hover:text-red-500 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all">
                    Delete
                  </button>
                </div>
                <p className="font-bold text-slate-800 mt-3">{cat.name}</p>
                {cat.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cat.description}</p>}
                <p className="text-xs text-slate-300 mt-2 font-mono">{cat.slug}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black text-slate-900">New Category</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 font-bold">✕</button>
              </div>
              {formError && <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{formError}</p>}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Category Name *</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Electronics"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Description</label>
                  <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map((icon) => (
                      <button key={icon} type="button" onClick={() => setForm((f) => ({ ...f, icon }))}
                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all ${form.icon === icon ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-violet-300'}`}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !form.name.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50">
                  {createMutation.isPending ? 'Creating...' : 'Create Category'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h2 className="text-lg font-black text-slate-900 mb-2">Delete Category?</h2>
              <p className="text-slate-500 text-sm mb-6">Products will not be deleted but will lose this category tag.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50">
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
