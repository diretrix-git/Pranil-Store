import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import Modal from "../../components/ui/DarkModal";
import Input from "../../components/ui/DarkInput";
import api from "../../api/axiosInstance";

const EMPTY = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  categories: "",
  notes: "",
};

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState(null);
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await api.get("/suppliers");
      return res.data.data?.suppliers ?? res.data.suppliers ?? res.data;
    },
  });
  const suppliers = Array.isArray(data) ? data : [];

  const openCreate = () => {
    setEditSupplier(null);
    setForm(EMPTY);
    setFormError("");
    setShowModal(true);
  };
  const openEdit = (s) => {
    setEditSupplier(s);
    setForm({
      name: s.name ?? "",
      contactPerson: s.contactPerson ?? "",
      email: s.email ?? "",
      phone: s.phone ?? "",
      address: s.address ?? "",
      categories: Array.isArray(s.categories) ? s.categories.join(", ") : "",
      notes: s.notes ?? "",
    });
    setFormError("");
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        categories: form.categories
          ? form.categories
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean)
          : [],
      };
      return editSupplier
        ? api.put(`/suppliers/${editSupplier._id}`, payload)
        : api.post("/suppliers", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["suppliers"]);
      setShowModal(false);
    },
    onError: (err) =>
      setFormError(err.response?.data?.message ?? "Failed to save."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["suppliers"]);
      setDeleteId(null);
    },
  });

  const formFields = [
    { name: "name", label: "Name" },
    { name: "contactPerson", label: "Contact Person" },
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone" },
    { name: "address", label: "Address" },
    { name: "categories", label: "Categories (comma-separated)" },
    { name: "notes", label: "Notes" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <div className="flex justify-between items-center mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-black text-slate-900"
          >
            Suppliers
          </motion.h1>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={openCreate}
            className="px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 shadow-sm shadow-violet-200"
          >
            + Add Supplier
          </motion.button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🏭</p>
            <p className="text-slate-400">No suppliers yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Name", "Contact", "Email", "Phone", ""].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr
                      key={s._id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {s.name}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {s.contactPerson ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {s.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {s.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right space-x-3">
                        <button
                          onClick={() => openEdit(s)}
                          className="text-violet-600 hover:text-violet-800 text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(s._id)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editSupplier ? "Edit Supplier" : "New Supplier"}
      >
        {formError && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {formError}
          </p>
        )}
        <div className="space-y-3">
          {formFields.map(({ name, label, type = "text" }) => (
            <Input
              key={name}
              label={label}
              type={type}
              value={form[name]}
              onChange={(e) =>
                setForm((f) => ({ ...f, [name]: e.target.value }))
              }
            />
          ))}
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
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="px-5 py-2 text-sm font-bold text-white rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : "Save"}
          </motion.button>
        </div>
      </Modal>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Supplier?"
      >
        <p className="text-slate-500 text-sm mb-6">
          This action cannot be undone.
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
