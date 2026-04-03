import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import api from '../../api/axiosInstance';

const ROLE_STYLES = {
  buyer:      'bg-blue-100 text-blue-700',
  seller:     'bg-violet-100 text-violet-700',
  superadmin: 'bg-red-100 text-red-700',
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data.data?.users ?? res.data.users ?? res.data;
    },
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id }) => api.patch(`/admin/users/${id}/status`),
    onSuccess: () => queryClient.invalidateQueries(['admin-users']),
  });

  const users = Array.isArray(data) ? data : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-black text-slate-900 mb-6">Users</motion.h1>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>{['Name', 'Email', 'Role', 'Status', 'Joined', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                      <td className="px-4 py-3 text-slate-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_STYLES[u.role] ?? 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {u.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => toggleStatus.mutate({ id: u._id })} disabled={toggleStatus.isPending}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 transition-colors ${u.isActive !== false ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'}`}>
                          {u.isActive !== false ? 'Deactivate' : 'Activate'}
                        </motion.button>
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
