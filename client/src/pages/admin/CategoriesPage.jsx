import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import Modal from "../../components/ui/DarkModal";
import Input from "../../components/ui/DarkInput";
import api from "../../api/axiosInstance";

const ICONS = [
  "📦",
  "💻",
  "👕",
  "🍎",
  "📚",
  "🏠",
  "⚽",
  "🎮",
  "💄",
  "🔧",
  "🚗",
  "🌿",
];

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "📦", description: "" });
  const [deleteId, setDeleteId] = useState(null);
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data.data?.categories ?? [];
    },
  });
  const categories = Array.isArray(data) ? data : [];

  const openCreate = () => {
    setForm({ name: "", icon: "📦", description: "" });
    setFormError("");
    setShowModal(true);
  };

  const createMutation = useMutation({
    mutationFn: () => api.post("/categories", form),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setShowModal(false);
    },
    onError: (err) =>
      setFormError(err.response?.data?.message ?? "Failed to create category."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setDeleteId(null);
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
        <div className="flex justify-between items-center mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-black text-slate-900"
          >
            Categories
          </motion.h1>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={openCreate}
            className="px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 shadow-sm shadow-violet-200"
          >
            + Add Category
          </motion.button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
          >
            {categories.map((cat) => (
              <motion.div
                key={cat._id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0 },
                }}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{cat.icon}</span>
                  <button
                    onClick={() => setDeleteId(cat._id)}
                    className="text-slate-300 hover:text-red-500 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all"
                  >
                    Delete
                  </button>
                </div>
                <p className="font-bold text-slate-800 mt-3">{cat.name}</p>
                {cat.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                )}
                <p className="text-xs text-slate-300 mt-2 font-mono">
                  {cat.slug}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="New Category"
      >
        {formError && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {formError}
          </p>
        )}
        <div className="space-y-4">
          <Input
            label="Category Name *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Electronics"
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Brief description"
          />
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all ${form.icon === icon ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-violet-300"}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !form.name.trim()}
            className="px-5 py-2 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50"
          >
            {createMutation.isPending ? "Creating..." : "Create Category"}
          </motion.button>
        </div>
      </Modal>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Category?"
      >
        <p className="text-slate-500 text-sm mb-6">
          Products in this category will not be deleted, but they will lose this
          category tag.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteId(null)}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => deleteMutation.mutate(deleteId)}
            disabled={deleteMutation.isPending}
            className="px-5 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl disabled:opacity-50"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </motion.button>
        </div>
      </Modal>
    </div>
  );
}
