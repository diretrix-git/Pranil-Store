import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import api from "../../api/axiosInstance";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => { const res = await api.get("/admin/users"); return res.data.data?.users ?? []; },
  });
  const toggleStatus = useMutation({
    mutationFn: ({ id }: { id: string }) => api.patch(`/admin/users/${id}/status`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
  const users: any[] = Array.isArray(data) ? data : [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Buyers</h1>
        <p className="text-sm text-slate-500 mt-0.5">{users.length} registered buyers</p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200"><p className="text-4xl mb-3">👥</p><p className="text-slate-500">No buyers yet.</p></div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{["Name", "Email", "Phone", "Status", "Joined", ""].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3 text-slate-500">{u.phone || "—"}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.isActive !== false ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{u.isActive !== false ? "Active" : "Inactive"}</span></td>
                    <td className="px-4 py-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => toggleStatus.mutate({ id: u._id })} disabled={toggleStatus.isPending}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 transition-colors ${u.isActive !== false ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"}`}>
                        {u.isActive !== false ? "Deactivate" : "Activate"}
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
  );
}
