import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axiosInstance';

const EMPTY = { name: '', description: '', price: '', stock: '', unit: 'pcs', vendor: '' };

function StockBadge({ stock }) {
  if (stock === 0) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Out of Stock</span>;
  if (stock < 20) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{stock} — Reorder</span>;
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{stock}</span>;
}

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

  const { data: vendorData } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => { const res = await api.get('/vendors'); return res.data.data?.vendors ?? []; },
  });
  const vendors = vendorData ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => { const res = await api.get('/products'); return res.data.data?.products ?? []; },
  });
  const products = Array.isArray(data) ? data : [];

  const openCreate = () => { setEditProduct(null); setForm(EMPTY); setSelectedCategories([]); setImageFiles([]); setFormError(''); setShowModal(true); };
  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name ?? '', description: p.description ?? '', price: p.price ?? '', stock: p.stock ?? '', unit: p.unit ?? 'pcs', vendor: p.vendor?._id ?? p.vendor ?? '' });
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">{products.length} items in inventory</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-opacity shadow-sm">
          + Add Product
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-slate-500 font-medium">No products yet</p>
          <button onClick={openCreate} className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-violet-600 border border-violet-200 hover:bg-violet-50 transition-colors">
            Add your first product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Product', 'Vendor', 'Categories', 'Price', 'Stock', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{p.name}</p>
                      {p.description && <p className="text-xs text-slate-400 truncate max-w-48">{p.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {p.vendor ? (
                        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{p.vendor.name}</span>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
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
                    <td className="px-4 py-3 font-semibold text-slate-800">{formatRs(p.price)}</td>
                    <td className="px-4 py-3"><StockBadge stock={p.stock} /></td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button onClick={() => openEdit(p)} className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors">Edit</button>
                      <button onClick={() => setDeleteId(p._id)} className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                <h2 className="text-lg font-black text-slate-900">{editProduct ? 'Edit Product' : 'New Product'}</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 font-bold">✕</button>
              </div>
              {formError && <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{formError}</p>}
              <div className="space-y-4">
                {[
                  { name: 'name', label: 'Product Name *', placeholder: 'e.g. Wireless Headphones' },
                  { name: 'description', label: 'Description', placeholder: 'Brief product description' },
                ].map(({ name, label, placeholder }) => (
                  <div key={name}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
                    <input value={form[name]} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))} placeholder={placeholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all" />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  {[{ name: 'price', label: 'Price ($) *', type: 'number', placeholder: '0.00' }, { name: 'stock', label: 'Stock *', type: 'number', placeholder: '0' }].map(({ name, label, type, placeholder }) => (
                    <div key={name}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
                      <input type={type} value={form[name]} onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))} placeholder={placeholder}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all" />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Unit</label>
                    <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400">
                      {['pcs', 'kg', 'g', 'L', 'mL', 'box', 'bag', 'pair', 'set', 'dozen'].map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Vendor</label>
                    <select value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400">
                      <option value="">No vendor</option>
                      {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                    Categories * <span className="text-slate-400 normal-case font-normal">(select one or more)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const selected = selectedCategories.includes(cat._id);
                      return (
                        <button key={cat._id} type="button" onClick={() => toggleCategory(cat._id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${selected ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600'}`}>
                          {cat.icon} {cat.name}
                        </button>
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
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || selectedCategories.length === 0}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50">
                  {saveMutation.isPending ? 'Saving...' : 'Save Product'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h2 className="text-lg font-black text-slate-900 mb-2">Delete Product?</h2>
              <p className="text-slate-500 text-sm mb-6">This action cannot be undone.</p>
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
