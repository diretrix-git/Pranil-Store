import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/Navbar";
import ProductCard from "../../components/buyer/ProductCard";
import api from "../../api/axiosInstance";
import { useAuth } from "../../context/AuthContext";
import { IProduct, ICategory, IVendor } from "../../types";

export default function HomePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const search   = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const vendor   = searchParams.get("vendor") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";

  const [localSearch, setLocalSearch] = useState(search);
  const [priceRange, setPriceRange] = useState([Number(minPrice) || 0, Number(maxPrice) || 5000]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (localSearch) next.set("q", localSearch); else next.delete("q");
        return next;
      }, { replace: true } as any);
    }, 350);
    return () => clearTimeout(t);
  }, [localSearch, setSearchParams]);

  const setFilter = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    }, { replace: true } as any);
  }, [setSearchParams]);

  const clearAll = () => { setLocalSearch(""); setPriceRange([0, 5000]); setSearchParams({}, { replace: true } as any); };

  const { data: catData } = useQuery({ queryKey: ["categories"], queryFn: async () => { const res = await api.get("/categories"); return res.data.data?.categories ?? []; } });
  const categories: ICategory[] = catData ?? [];

  const { data: vendorData } = useQuery({ queryKey: ["vendors"], queryFn: async () => { const res = await api.get("/vendors"); return res.data.data?.vendors ?? []; } });
  const vendors: IVendor[] = vendorData ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ["products", search, category, vendor, minPrice, maxPrice],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (vendor) params.vendor = vendor;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      const res = await api.get("/products", { params });
      return res.data;
    },
  });
  const products: IProduct[] = data?.data?.products ?? data?.products ?? [];
  const hasFilters = category || vendor || minPrice || maxPrice || search;
  const ctaTo = user ? (user.role === "buyer" ? "/cart" : "/admin/dashboard") : "/sign-up";
  const ctaLabel = user ? (user.role === "buyer" ? "🛒 Go to Cart" : "Dashboard") : "Start Shopping →";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      {user?.role !== "admin" && (
        <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white py-14 sm:py-20 px-4">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative max-w-3xl mx-auto text-center">
            <span className="inline-block bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">B2B Marketplace</span>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">Source Products, <span className="text-yellow-300">Buy in Bulk</span></h1>
            <p className="text-violet-100 text-lg max-w-xl mx-auto mb-7">Trusted vendors. Competitive prices. Streamlined ordering.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link to={ctaTo} className="inline-block px-7 py-3 rounded-xl font-bold text-violet-700 bg-white hover:bg-violet-50 transition-colors shadow-lg">{ctaLabel}</Link>
              <Link to="/about" className="inline-block px-7 py-3 rounded-xl font-bold text-white bg-white/15 border border-white/30 hover:bg-white/25 transition-colors">Learn More</Link>
            </div>
          </motion.div>
        </section>
      )}
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20 space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Search</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input type="text" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Product name..." className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Category</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2.5 cursor-pointer group"><input type="radio" name="category" checked={!category} onChange={() => setFilter("category", "")} className="accent-violet-600" /><span className="text-sm text-slate-700 group-hover:text-violet-600 transition-colors">All Categories</span></label>
                {categories.map((c) => <label key={c._id} className="flex items-center gap-2.5 cursor-pointer group"><input type="radio" name="category" checked={category === c.slug} onChange={() => setFilter("category", c.slug)} className="accent-violet-600" /><span className="text-sm text-slate-700 group-hover:text-violet-600 transition-colors">{c.icon} {c.name}</span></label>)}
              </div>
            </div>
            {vendors.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Vendor</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-2.5 cursor-pointer group"><input type="radio" name="vendor" checked={!vendor} onChange={() => setFilter("vendor", "")} className="accent-violet-600" /><span className="text-sm text-slate-700 group-hover:text-violet-600 transition-colors">All Vendors</span></label>
                  {vendors.map((v) => <label key={v._id} className="flex items-center gap-2.5 cursor-pointer group"><input type="radio" name="vendor" checked={vendor === v.slug} onChange={() => setFilter("vendor", v.slug)} className="accent-violet-600" /><span className="text-sm text-slate-700 group-hover:text-violet-600 transition-colors truncate">{v.name}</span></label>)}
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Price Range</label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input type="number" min={0} value={priceRange[0]} onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} onBlur={() => setFilter("minPrice", priceRange[0] > 0 ? String(priceRange[0]) : "")} placeholder="Min" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  <span className="text-slate-400 text-xs">–</span>
                  <input type="number" min={0} value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} onBlur={() => setFilter("maxPrice", priceRange[1] < 5000 ? String(priceRange[1]) : "")} placeholder="Max" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
                <input type="range" min={0} max={5000} step={50} value={priceRange[1]} onChange={(e) => { const v = Number(e.target.value); setPriceRange([priceRange[0], v]); setFilter("maxPrice", v < 5000 ? String(v) : ""); }} className="w-full accent-violet-600" />
                <p className="text-xs text-slate-400 text-center">Rs. {priceRange[0]} – Rs. {priceRange[1]}</p>
              </div>
            </div>
            {hasFilters && <button onClick={clearAll} className="w-full py-2 rounded-lg text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-red-500 hover:border-red-200 transition-all">Clear all filters</button>}
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          <div className="lg:hidden mb-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input type="text" value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search products..." className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm" />
            </div>
          </div>
          <div className="lg:hidden flex gap-2 flex-wrap mb-5">
            <button onClick={() => setFilter("category", "")} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${!category ? "bg-violet-600 text-white" : "bg-white text-slate-500 border border-slate-200"}`}>All</button>
            {categories.map((c) => <button key={c._id} onClick={() => setFilter("category", c.slug)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${category === c.slug ? "bg-violet-600 text-white" : "bg-white text-slate-500 border border-slate-200"}`}>{c.icon} {c.name}</button>)}
          </div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500 font-medium">{isLoading ? "Loading..." : `${products.length} product${products.length !== 1 ? "s" : ""} found`}</p>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
              <p className="text-4xl mb-3">🔍</p><p className="text-slate-500 font-medium">No products found</p>
              {hasFilters && <button onClick={clearAll} className="mt-4 text-sm text-violet-600 font-semibold hover:underline">Clear all filters</button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => <ProductCard key={product._id} product={product} />)}
            </div>
          )}
        </div>
      </div>
      <footer className="border-t border-slate-200 bg-white mt-12 py-8 px-4 text-center">
        <p className="text-base font-black text-slate-800 mb-1">🛍️ MarketHub</p>
        <p className="text-slate-400 text-sm">B2B Marketplace — Trusted vendors, bulk pricing.</p>
        <div className="flex justify-center gap-6 mt-3 text-sm text-slate-400">
          <Link to="/about" className="hover:text-violet-600 transition-colors">About</Link>
          <Link to="/contact" className="hover:text-violet-600 transition-colors">Contact</Link>
          <Link to="/sign-in" className="hover:text-violet-600 transition-colors">Login</Link>
        </div>
      </footer>
    </div>
  );
}
