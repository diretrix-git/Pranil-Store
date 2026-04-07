import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axiosInstance";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Something went wrong. Please try again.");
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
          <h1 className="text-2xl font-black text-slate-900">Forgot Password</h1>
          <p className="text-slate-500 text-sm mt-1">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📬</div>
            <p className="text-slate-700 font-semibold mb-2">Check your inbox</p>
            <p className="text-slate-500 text-sm mb-6">
              If an account exists for <strong>{email}</strong>, a reset link has been sent. It expires in 15 minutes.
            </p>
            <Link
              to="/login"
              className="text-sm font-semibold text-violet-600 hover:text-violet-800 transition-colors"
            >
              ← Back to Login
            </Link>
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
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
              {loading ? "Sending..." : "Send Reset Link"}
            </motion.button>
            <p className="text-center text-sm text-slate-500">
              Remember your password?{" "}
              <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-800 transition-colors">
                Log in
              </Link>
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
