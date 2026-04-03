import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function RegisterPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({
      ...err,
      [e.target.name]: undefined,
      general: undefined,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const res = await api.post("/auth/register", form);
      const user = res.data.data?.user ?? res.data.user ?? res.data;
      setUser(user);
      navigate("/");
    } catch (err) {
      if (err.response?.status === 422) {
        const fieldErrors = {};
        (err.response.data.errors ?? []).forEach(({ field, message }) => {
          fieldErrors[field] = message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({
          general:
            err.response?.data?.message ??
            "Registration failed. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
    {
      name: "email",
      label: "Email address",
      type: "email",
      placeholder: "you@example.com",
    },
    {
      name: "phone",
      label: "Phone number",
      type: "tel",
      placeholder: "+1 234 567 8900",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "Min 8 chars with a number",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl">🛍️</span>
          <span className="font-black text-lg bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            MarketHub
          </span>
        </Link>
        <Link
          to="/"
          className="text-sm text-slate-500 hover:text-violet-600 transition-colors font-medium"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="flex-1 flex">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 items-center justify-center p-12 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 70% 30%, white 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative text-center text-white"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="text-7xl mb-6"
            >
              🛒
            </motion.div>
            <h2 className="text-3xl font-black mb-3">Join MarketHub</h2>
            <p className="text-violet-200 text-base max-w-xs mx-auto mb-8">
              Create your account and start shopping in minutes.
            </p>
            {[
              { icon: "📦", text: "Browse thousands of products" },
              { icon: "🛒", text: "Buy in bulk at great prices" },
              { icon: "🧾", text: "Track orders & print invoices" },
              { icon: "🔒", text: "Secure & private shopping" },
            ].map(({ icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 bg-white/15 rounded-xl px-4 py-2.5 text-left mb-2"
              >
                <span className="text-lg">{icon}</span>
                <p className="text-white text-sm font-medium">{text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Right form */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.07 } },
            }}
            initial="hidden"
            animate="show"
            className="w-full max-w-md"
          >
            <motion.div variants={fadeUp} className="text-center mb-8">
              <h1 className="text-3xl font-black text-slate-900 mb-2">
                Create account
              </h1>
              <p className="text-slate-500">
                Free to join. Start shopping right away.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm"
            >
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5"
                >
                  ⚠️ {errors.general}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {fields.map(({ name, label, type, placeholder }) => (
                  <div key={name}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {label}
                    </label>
                    <input
                      type={type}
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${errors[name] ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                    />
                    {errors[name] && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-500 text-xs mt-1.5"
                      >
                        {errors[name]}
                      </motion.p>
                    )}
                  </div>
                ))}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md shadow-violet-200 mt-2"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    "Create Account →"
                  )}
                </motion.button>
              </form>
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="text-sm text-slate-500 mt-5 text-center"
            >
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-violet-600 font-semibold hover:text-violet-700 transition-colors"
              >
                Sign in
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
