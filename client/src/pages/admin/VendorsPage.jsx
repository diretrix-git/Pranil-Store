import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axiosInstance';

const EMPTY = { name: '', contactPerson: '', email: '', phone: '', address: '', description: '' };

export default function AdminVendorsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState(null);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: async () => { const res = await api.get('/vendors/all'); return res.data.data?.vendors ?? []; },
  });
  const vendors = Array.isArray(data) ? data : [];

  const openCreate = () => { setEditVendor(null); setForm(EMPTY); setFormError(''); setShowModal(true); };
  const openEdit = (v) => {
    setEditVendor(v);
    setForm({ name: v.name ?? '', contactPerson: v.contactPerson ?? '', email: v.email ?? '', phone: v.phone ?? '', address: v.address ?? '', description: v.description ?? '' });
    setFormError(''); setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => editVendor ? api.put(`/vendors/${editVendor._id}`, form) : api.post('/vendors', form),
    onSuccess: () => { queryClient.invalidateQueries(['admin-vendors']); setShowModal(false); },
    onError: (err) => setFormError(err.response?.data?.message ?? 'Failed to save.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/vendors/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['admin-vendors']); setDeleteId(null); },
  });

  const fields = [
    { name: 'name', label: 'Company Name *', placeholder: 'Acme Corp' },
    { name: 'contactPerson', label: 'Contact Person', placeholder: 'John Doe' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'vendor@example.com' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 234 567 8900' },
    { name: 'address', label: 'Address', placeholder: '123 Main St, City' },
    { name: 'description', label: 'About', placeholder: 'Brief description of the vendor' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Vendors</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your supplier partners</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-opacity shadow-sm">
          + Add Vendor
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <p className="text-4xl mb-3">🏭</p>
          <p className="text-slate-500 font-medium">No vendors yet</p>
          <p className="text-slate-400 text-sm mt-1">Add your first supplier partner</p>
          <button onClick={openCreate} className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-violet-600 border border-violet-200 hover:bg-violet-50 transition-colors">
            Add Vendor
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Company', 'Contact', 'Email', 'Phone', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendors.map((v) => (
                <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{v.name}</p>
                    {v.description && <p className="text-xs text-slate-400 truncate max-w-48">{v.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{v.contactPerson || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{v.email || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{v.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {v.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEdit(v)} className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">Edit</button>
                    <button onClick={() => setDeleteId(v._id)} className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black text-slate-900">{editVendor ? 'Edit Vendor' : 'New Vendor'}</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 font-bold">✕</button>
              </div>
              {formError && <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{formError}</p>}
              <div className="space-y-3">
                {fields.map(({ name, label, type = 'text', placeholder }) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
                    <input type={type} value={form[name]} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50">
                  {saveMutation.isPending ? 'Saving...' : 'Save Vendor'}
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
              <h2 className="text-lg font-black text-slate-900 mb-2">Delete Vendor?</h2>
              <p className="text-slate-500 text-sm mb-6">Products linked to this vendor will not be deleted.</p>
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
    </div>
  );
}
