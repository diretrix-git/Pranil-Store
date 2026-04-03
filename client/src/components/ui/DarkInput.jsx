export default function Input({ label, error, className = '', ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
      )}
      <input
        {...props}
        className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'} ${className}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
