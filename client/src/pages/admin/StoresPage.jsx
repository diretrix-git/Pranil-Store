import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import api from "../../api/axiosInstance";

export default function AdminStoresPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-stores"],
    queryFn: async () => {
      const res = await api.get("/stores");
      return res.data.data?.stores ?? res.data.stores ?? res.data;
    },
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id }) => api.patch(`/stores/${id}/status`),
    onSuccess: () => queryClient.invalidateQueries(["admin-stores"]),
  });

  const stores = Array.isArray(data) ? data : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-black text-slate-900 mb-6"
        >
          Stores
        </motion.h1>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Store Name", "Owner", "Status", "Created", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr
                      key={store._id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {store.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {store.owner?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${store.isActive !== false ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {store.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(store.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleStatus.mutate({ id: store._id })}
                          disabled={toggleStatus.isPending}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 transition-colors ${store.isActive !== false ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-200"}`}
                        >
                          {store.isActive !== false ? "Deactivate" : "Activate"}
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
