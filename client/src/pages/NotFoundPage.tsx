import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function NotFoundPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const homeLink = user?.role === "admin" ? "/admin/dashboard" : "/";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <motion.p animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }} className="text-8xl mb-6">🗺️</motion.p>
        <h1 className="text-7xl font-black text-slate-900 mb-3">404</h1>
        <h2 className="text-2xl font-bold text-slate-700 mb-3">Page Not Found</h2>
        <p className="text-slate-500 text-base max-w-sm mx-auto mb-8">Looks like you've wandered off the map. The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Link to={homeLink} className="inline-block px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-opacity shadow-md shadow-violet-200">← Back to Home</Link>
          </motion.div>
          <motion.div whileTap={{ scale: 0.97 }}>
            <button onClick={() => navigate(-1)} className="inline-block px-8 py-3 rounded-xl font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">Go Back</button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
