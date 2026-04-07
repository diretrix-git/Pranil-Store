import { useState, FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axiosInstance";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Reset link is invalid or has expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-8"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl">🛍️</span>
            <span className="text-xl font-black bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              MarketHub
            </span>
          </Link>
          <h1 className="text-2xl font-black text-slate-900">Set New Password</h1>
          <p className="text-slate-500 text-sm mt-1">Choose a strong password for your account.</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-slate-700 font-semibold mb-2">Password updated!</p>
            <p className="text-slate-500 text-sm">Redirecting you to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Confirm Password
              </label>
              <input
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Updating..." : "Reset Password"}
            </motion.button>
            <p className="text-center text-sm text-slate-500">
              <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-800 transition-colors">
                ← Back to Login
              </Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
