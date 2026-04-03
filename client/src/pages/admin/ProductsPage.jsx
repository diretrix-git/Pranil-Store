import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Modal from '../../components/ui/DarkModal';
import Input from '../../components/ui/DarkInput';
import api from '../../api/axiosInstance';

const EMPTY = { name: '', description: '', price: '', stock: '', unit: 'pcs' };

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [formError, setFormError] = useState('');

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const res = await api.get('/categories'); return res.data.data?.categories ?? []; },
  });
  const categories = catData ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data.data?.products ?? [];
    },
  });
  const products = Array.isArray(data) ? data : [];

  const openCreate = () => { setEditProduct(null); setForm(EMPTY); setSelectedCategories([]); setImageFiles([]); setFormError(''); setShowModal(true); };
  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name ?? '', description: p.description ?? '', price: p.price ?? '', stock: p.stock ?? '', unit: p.unit ?? 'pcs' });
    setSelectedCategories((p.categories ?? []).map((c) => c._id ?? c));
    setImageFiles([]); setFormError(''); setShowModal(true);
  };

  const toggleCategory = (id) =>
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      fd.append('categories', selectedCategories.join(','));
      imageFiles.forEach((f) => fd.append('images', f));
      return editProduct ? api.put(`/products/${editProduct._id}`, fd) : api.post('/products', fd);
    },
    onSuccess: () => { queryClient.invalidateQueries(['admin-products']); setShowModal(false); },
    onError: (err) => setFormError(err.response?.data?.message ?? 'Failed to save product.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => { queryClient.invalidateQueries(['admin-products']); setDeleteId(null); },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <div className="flex justify-between items-center mb-6">
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-black text-slate-900">Products</motion.h1>
          <motion.button whileTap={{ scale: 0.96 }} onClick={openCreate}
            className="px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 shadow-sm shadow-violet-200">
            + Add Product
          </motion.button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📦</p>
            <p className="text-slate-400 mb-4">No products yet.</p>
            <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600">
              Add your first product
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>{['Name', 'Categories', 'Price', 'Stock', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(p.categories ?? []).map((c) => (
                            <span key={c._id ?? c} className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                              {c.icon} {c.name}
                            </span>
                          ))}
                          {(!p.categories || p.categories.length === 0) && <span className="text-xs text-slate-400">{p.category || '—'}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">${Number(p.price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-500">{p.stock} {p.unit}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {p.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-3">
                        <button onClick={() => openEdit(p)} className="text-violet-600 hover:text-violet-800 text-xs font-semibold">Edit</button>
                        <button onClick={() => setDeleteId(p._id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editProduct ? 'Edit Product' : 'New Product'}>
        {formError && <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{formError}</p>}
        <div className="space-y-4">
          <Input label="Product Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Wireless Headphones" />
          <Input label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief product description" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price ($) *" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" />
            <Input label="Stock *" type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Unit</label>
            <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400">
              {['pcs', 'kg', 'g', 'L', 'mL', 'box', 'bag', 'pair', 'set', 'dozen'].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              Categories * <span className="text-slate-400 normal-case font-normal">(select one or more)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const selected = selectedCategories.includes(cat._id);
                return (
                  <motion.button key={cat._id} type="button" whileTap={{ scale: 0.95 }}
                    onClick={() => toggleCategory(cat._id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${selected ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600'}`}>
                    {cat.icon} {cat.name}
                  </motion.button>
                );
              })}
            </div>
            {selectedCategories.length === 0 && <p className="text-xs text-amber-500 mt-1">Please select at least one category</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Product Images</label>
            <input type="file" multiple accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setImageFiles(Array.from(e.target.files))}
              className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-100 file:text-violet-700" />
            <p className="text-xs text-slate-400 mt-1">JPEG, PNG or WebP · Max 5MB each</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || selectedCategories.length === 0}
            className="px-5 py-2 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50">
            {saveMutation.isPending ? 'Saving...' : 'Save Product'}
          </motion.button>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Product?">
        <p className="text-slate-500 text-sm mb-6">This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}
            className="px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl disabled:opacity-50">
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </motion.button>
        </div>
      </Modal>
    </div>
  );
}
