import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import api from '../api/axiosInstance';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: undefined, general: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await api.post('/contact', form);
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      if (err.response?.status === 422) {
        const fieldErrors = {};
        (err.response.data.errors ?? []).forEach(({ field, message }) => { fieldErrors[field] = message; });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: err.response?.data?.message ?? 'Failed to send message. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white py-16 sm:py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative max-w-xl mx-auto">
          <p className="text-5xl mb-4">💬</p>
          <h1 className="text-3xl sm:text-4xl font-black mb-3">Get in Touch</h1>
          <p className="text-violet-100 text-lg">Have a question or feedback? We'd love to hear from you.</p>
        </motion.div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact info */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 mb-5">Contact Info</h2>
            {[
              { icon: '📧', label: 'Email', value: 'admin@markethub.com' },
              { icon: '⏰', label: 'Response Time', value: 'Within 24 hours' },
              { icon: '📍', label: 'Location', value: 'Available worldwide' },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Form */}
          <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
            initial="hidden" animate="show"
            className="lg:col-span-2">
            {success ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl border border-green-200 p-10 shadow-sm text-center">
                <p className="text-5xl mb-4">✅</p>
                <h3 className="text-xl font-black text-slate-900 mb-2">Message Sent!</h3>
                <p className="text-slate-500 mb-6">We've received your message and will get back to you within 24 hours.</p>
                <button onClick={() => setSuccess(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90">
                  Send Another
                </button>
              </motion.div>
            ) : (
              <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 mb-6">Send a Message</h2>

                {errors.general && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                    ⚠️ {errors.general}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { name: 'name',  label: 'Full Name *',    type: 'text',  placeholder: 'John Doe' },
                      { name: 'email', label: 'Email address *', type: 'email', placeholder: 'you@example.com' },
                    ].map(({ name, label, type, placeholder }) => (
                      <div key={name}>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                        <input type={type} name={name} value={form[name]} onChange={handleChange}
                          placeholder={placeholder}
                          className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${errors[name] ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} />
                        {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone (optional)</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                      placeholder="+1 234 567 8900"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject *</label>
                    <input type="text" name="subject" value={form.subject} onChange={handleChange}
                      placeholder="What's this about?"
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${errors.subject ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} />
                    {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Message *</label>
                    <textarea name="message" value={form.message} onChange={handleChange} rows={5}
                      placeholder="Tell us more..."
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all resize-none ${errors.message ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                  </div>

                  <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 transition-opacity shadow-md shadow-violet-200">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : 'Send Message →'}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 px-4 text-center">
        <p className="text-slate-400 text-sm">© 2025 MarketHub. All rights reserved.</p>
        <div className="flex justify-center gap-6 mt-3 text-sm text-slate-400">
          <Link to="/" className="hover:text-violet-600 transition-colors">Home</Link>
          <Link to="/about" className="hover:text-violet-600 transition-colors">About</Link>
        </div>
      </footer>
    </div>
  );
}
