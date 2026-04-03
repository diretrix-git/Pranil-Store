import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

const features = [
  { icon: '🏪', title: 'Multi-Vendor', desc: 'Hundreds of independent sellers, each with their own store and product catalog.' },
  { icon: '🔒', title: 'Secure', desc: 'JWT authentication, httpOnly cookies, and encrypted passwords keep your account safe.' },
  { icon: '📦', title: 'Order Tracking', desc: 'Real-time order status updates from placement to delivery.' },
  { icon: '🧾', title: 'Instant Invoices', desc: 'Print-ready invoices generated automatically for every order.' },
  { icon: '⚡', title: 'Fast & Reliable', desc: 'Built on the MERN stack for speed and scalability.' },
  { icon: '🌍', title: 'For Everyone', desc: "Whether you're a buyer, seller, or platform admin — MarketHub has you covered." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white py-20 sm:py-28 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="relative max-w-2xl mx-auto">
          <p className="text-6xl mb-5">🛍️</p>
          <h1 className="text-4xl sm:text-5xl font-black mb-4">
            About <span className="text-yellow-300">MarketHub</span>
          </h1>
          <p className="text-violet-100 text-lg sm:text-xl leading-relaxed">
            A modern multi-vendor marketplace connecting buyers and sellers in one seamless platform.
          </p>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
        <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon, title, desc }) => (
            <motion.div key={title} variants={fadeUp}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-violet-200 transition-all">
              <p className="text-3xl mb-3">{icon}</p>
              <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="text-center py-16 px-4 border-t border-slate-200 bg-white">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-3xl font-black text-slate-900 mb-3">Ready to get started?</h2>
          <p className="text-slate-500 mb-8">Join thousands of buyers and sellers on MarketHub today.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/register"
              className="px-8 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-opacity shadow-md shadow-violet-200">
              Create Account
            </Link>
            <Link to="/"
              className="px-8 py-3 rounded-2xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors">
              Browse Products
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-4 text-center bg-slate-50">
        <p className="text-slate-400 text-sm">© 2025 MarketHub. All rights reserved.</p>
      </footer>
    </div>
  );
}
