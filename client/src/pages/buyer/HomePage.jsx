import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar";
import ProductCard from "../../components/buyer/ProductCard";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";

export default function HomePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch categories from Atlas
  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data.data?.categories ?? [];
    },
  });
  const categories = catData ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["products", debouncedSearch, category],
    queryFn: async () => {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (category) params.category = category;
      const res = await api.get("/products", { params });
      return res.data;
    },
  });

  const products = data?.data?.products ?? data?.products ?? [];

  const ctaTo = user
    ? user.role === "buyer"
      ? "/cart"
      : user.role === "seller"
        ? "/seller/dashboard"
        : "/admin/dashboard"
    : "/register";
  const ctaLabel = user
    ? user.role === "buyer"
      ? "🛒 Go to Cart"
      : "Go to Dashboard"
    : "Start Shopping →";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white py-20 sm:py-28 px-4">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-3xl mx-auto text-center"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest"
          >
            Multi-Vendor Marketplace
          </motion.span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-5">
            Shop Everything,{" "}
            <span className="text-yellow-300">All in One Place</span>
          </h1>
          <p className="text-violet-100 text-lg sm:text-xl max-w-xl mx-auto mb-8">
            Discover thousands of products from trusted sellers across every
            category.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to={ctaTo}
                className="inline-block px-8 py-3.5 rounded-2xl font-bold text-violet-700 bg-white hover:bg-violet-50 transition-colors shadow-lg shadow-black/10"
              >
                {ctaLabel}
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/about"
                className="inline-block px-8 py-3.5 rounded-2xl font-bold text-white bg-white/15 border border-white/30 hover:bg-white/25 transition-colors"
              >
                Learn More
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative max-w-2xl mx-auto mt-12 flex flex-wrap justify-center gap-4"
        >
          {[
            "🔒 Secure Checkout",
            "⚡ Fast Delivery",
            "📦 Easy Returns",
            "⭐ Trusted Sellers",
          ].map((t) => (
            <span
              key={t}
              className="text-xs text-white/70 font-medium bg-white/10 px-3 py-1.5 rounded-full"
            >
              {t}
            </span>
          ))}
        </motion.div>
      </section>

      {/* Search & Filter */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 mb-5"
        >
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm transition-all"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm min-w-40"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Category pills from DB */}
        <div className="flex gap-2 flex-wrap mb-8">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setCategory("")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              category === ""
                ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                : "bg-white text-slate-500 border border-slate-200 hover:border-violet-300 hover:text-violet-600"
            }`}
          >
            All
          </motion.button>
          {categories.map((c, i) => (
            <motion.button
              key={c._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategory(c.slug)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                category === c.slug
                  ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                  : "bg-white text-slate-500 border border-slate-200 hover:border-violet-300 hover:text-violet-600"
              }`}
            >
              {c.icon} {c.name}
            </motion.button>
          ))}
        </div>

        {/* Products */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-slate-400 text-lg">No products found.</p>
          </motion.div>
        ) : (
          <>
            <p className="text-sm text-slate-400 mb-5 font-medium">
              {products.length} products found
            </p>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
              variants={{ show: { transition: { staggerChildren: 0.04 } } }}
              initial="hidden"
              animate="show"
            >
              <AnimatePresence>
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16 py-10 px-4 text-center">
        <p className="text-lg font-black text-slate-800 mb-1">🛍️ MarketHub</p>
        <p className="text-slate-400 text-sm">
          The multi-vendor marketplace for everyone.
        </p>
        <div className="flex justify-center gap-6 mt-4 text-sm text-slate-400">
          <Link to="/about" className="hover:text-violet-600 transition-colors">
            About
          </Link>
          <Link to="/login" className="hover:text-violet-600 transition-colors">
            Login
          </Link>
          <Link
            to="/register"
            className="hover:text-violet-600 transition-colors"
          >
            Register
          </Link>
        </div>
      </footer>
    </div>
  );
}
