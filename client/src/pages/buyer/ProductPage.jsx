import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

export default function ProductPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [cartMsg, setCartMsg] = useState("");
  const [cartError, setCartError] = useState("");

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      // Response shape: { status, data: { product }, message }
      return res.data.data?.product ?? res.data.product ?? res.data;
    },
  });

  const addToCart = useMutation({
    mutationFn: () => api.post("/cart/add", { productId: id, quantity: qty }),
    onSuccess: () => {
      queryClient.invalidateQueries(["cart"]);
      setCartMsg("Added to cart!");
      setCartError("");
      setTimeout(() => setCartMsg(""), 2500);
    },
    onError: (err) => {
      setCartError(err.response?.data?.message ?? "Failed to add to cart.");
      setTimeout(() => setCartError(""), 3000);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !product || !product.name) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-slate-500 text-lg mb-4">Product not found.</p>
          <Link
            to="/"
            className="text-violet-600 font-semibold hover:underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.filter(Boolean) ?? [];
  const price = Number(product.price) || 0;
  const stock = Number(product.stock) ?? 0;
  const outOfStock = stock === 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <Link to="/" className="hover:text-violet-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">{product.name}</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image panel */}
            <div className="p-6 bg-gradient-to-br from-violet-50 to-indigo-50">
              <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-sm mb-4">
                {images[activeImg] ? (
                  <img
                    src={images[activeImg]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    📦
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {images.map((img, i) => (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveImg(i)}
                      className={`w-14 h-14 rounded-xl border-2 overflow-hidden transition-all ${i === activeImg ? "border-violet-500 shadow-md" : "border-slate-200 hover:border-violet-300"}`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Info panel */}
            <div className="p-6 sm:p-8 flex flex-col">
              {/* Categories */}
              {product.categories?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {product.categories.map((c) => (
                    <span
                      key={c._id ?? c}
                      className="text-xs font-bold bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full"
                    >
                      {c.icon} {c.name}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 leading-tight">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-black text-slate-900">
                  ${price.toFixed(2)}
                </span>
                <span className="text-sm text-slate-400">
                  per {product.unit || "pcs"}
                </span>
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${outOfStock ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}
                >
                  {outOfStock ? "Out of Stock" : `${stock} in stock`}
                </span>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                  {product.description}
                </p>
              )}

              {/* Add to cart — buyers only */}
              {user?.role === "buyer" && (
                <div className="mt-auto">
                  {cartError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-500 text-sm mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2"
                    >
                      ⚠️ {cartError}
                    </motion.p>
                  )}
                  {cartMsg && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-green-600 text-sm mb-3 bg-green-50 border border-green-200 rounded-xl px-3 py-2"
                    >
                      ✓ {cartMsg}
                    </motion.p>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="px-3 py-2.5 text-slate-600 hover:bg-slate-50 transition-colors font-bold"
                      >
                        −
                      </button>
                      <span className="px-4 py-2.5 text-sm font-semibold text-slate-800 min-w-10 text-center">
                        {qty}
                      </span>
                      <button
                        onClick={() => setQty((q) => Math.min(stock, q + 1))}
                        className="px-3 py-2.5 text-slate-600 hover:bg-slate-50 transition-colors font-bold"
                      >
                        +
                      </button>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => addToCart.mutate()}
                      disabled={addToCart.isPending || outOfStock}
                      className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md shadow-violet-200"
                    >
                      {addToCart.isPending
                        ? "Adding..."
                        : outOfStock
                          ? "Out of Stock"
                          : "🛒 Add to Cart"}
                    </motion.button>
                  </div>
                </div>
              )}

              {!user && (
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500 mb-3">
                    Sign in to add this item to your cart.
                  </p>
                  <Link
                    to="/login"
                    className="block text-center py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-opacity"
                  >
                    Sign In to Buy
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
