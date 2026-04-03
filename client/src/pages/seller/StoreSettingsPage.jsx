import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Input from '../../components/ui/DarkInput';
import api from '../../api/axiosInstance';

export default function StoreSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', invoiceNote: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: store, isLoading } = useQuery({
    queryKey: ['my-store'],
    queryFn: async () => {
      const res = await api.get('/stores/me');
      return res.data.data?.store ?? res.data.store ?? res.data;
    },
  });

  useEffect(() => {
    if (store) {
      setForm({ name: store.name ?? '', email: store.email ?? '', phone: store.phone ?? '', address: store.address ?? '', invoiceNote: store.invoiceNote ?? '' });
    }
  }, [store]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (logoFile) fd.append('logo', logoFile);
      return api.put('/stores/me', fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-store']);
      setSuccessMsg('Store settings saved successfully.');
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => setErrorMsg(err.response?.data?.message ?? 'Failed to save settings.'),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-10">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-black text-slate-900 mb-6">Store Settings</motion.h1>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">✓ {successMsg}</div>}
            {errorMsg && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">⚠️ {errorMsg}</div>}

            {store?.logo && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Current Logo</p>
                <img src={store.logo} alt="Store logo" className="h-16 object-contain rounded-xl border border-slate-200" />
              </div>
            )}

            {[
              { name: 'name', label: 'Store Name' }, { name: 'email', label: 'Email', type: 'email' },
              { name: 'phone', label: 'Phone' }, { name: 'address', label: 'Address' },
              { name: 'invoiceNote', label: 'Invoice Footer Note' },
            ].map(({ name, label, type = 'text' }) => (
              <Input key={name} label={label} type={type} value={form[name]}
                onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))} />
            ))}

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Logo Image</label>
              <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0] ?? null)}
                className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-100 file:text-violet-700" />
            </div>

            <motion.button whileTap={{ scale: 0.97 }} onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 shadow-sm shadow-violet-200">
              {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
