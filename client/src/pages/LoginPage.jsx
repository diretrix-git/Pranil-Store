import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const ROLE_DASHBOARDS = { buyer: '/', admin: '/admin/dashboard' };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

export default function LoginPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: undefined, general: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = await api.post('/auth/login', form);
      const user = res.data.data?.user ?? res.data.user ?? res.data;
      setUser(user);
      navigate(ROLE_DASHBOARDS[user.role] ?? '/');
    } catch (err) {
      if (err.response?.status === 422) {
        const fieldErrors = {};
        (err.response.data.errors ?? []).forEach(({ field, message }) => { fieldErrors[field] = message; });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: err.response?.data?.message ?? 'Login failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl">🛍️</span>
          <span className="font-black text-lg bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">MarketHub</span>
        </Link>
        <Link to="/" className="text-sm text-slate-500 hover:text-violet-600 transition-colors font-medium">← Back to Home</Link>
      </div>

      {/* Centered form — no hero panel, works cleanly for both buyer and admin */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
          initial="hidden" animate="show" className="w-full max-w-md">
          <motion.div variants={fadeUp} className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-4 shadow-lg shadow-violet-200">
              <span className="text-2xl">🛍️</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome back</h1>
            <p className="text-slate-500">Sign in to your MarketHub account</p>
          </motion.div>

          <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            {errors.general && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                ⚠️ {errors.general}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} />
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3 pr-11 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>}
              </div>

              <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md shadow-violet-200">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In →'}
              </motion.button>
            </form>
          </motion.div>

          <motion.p variants={fadeUp} className="text-sm text-slate-500 mt-5 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-violet-600 font-semibold hover:text-violet-700 transition-colors">
              Create one free
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
