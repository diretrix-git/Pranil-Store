import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function ProductCard({ product }) {
  const image = product.images?.[0] || null;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.compareAtPrice) * 100) : null;

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }}>
      <Link to={`/products/${product._id}`}
        className="group block bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:shadow-violet-100 hover:border-violet-200 transition-all duration-200">
        <div className="aspect-square bg-gradient-to-br from-violet-50 to-indigo-50 overflow-hidden relative">
          {image ? (
            <img src={image} alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
          )}
          {discountPct && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
              -{discountPct}%
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                Out of Stock
              </span>
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-xs font-bold text-violet-500 uppercase tracking-wide truncate">{product.category}</p>
          <h3 className="font-semibold text-slate-800 text-sm mt-0.5 truncate">{product.name}</h3>
          {product.store?.name && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">by {product.store.name}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-base font-black text-slate-900">${Number(product.price).toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">${Number(product.compareAtPrice).toFixed(2)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
