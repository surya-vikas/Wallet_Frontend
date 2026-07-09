export default function Button({ children, variant = 'primary', disabled, loading, onClick, className = '', type = 'button', ...props }) {
  const base = 'w-full inline-flex items-center justify-center gap-2 font-semibold py-3.5 px-6 rounded-2xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  const variants = {
    primary: 'bg-[#4f46e5] text-white active:bg-[#4338ca] shadow-[0_12px_24px_rgba(79,70,229,0.18)]',
    secondary: 'bg-slate-100 text-slate-700 active:bg-slate-200 dark:bg-[#171d27] dark:text-slate-200 dark:active:bg-[#1f2632]',
    danger: 'bg-red-500 text-white active:bg-red-600',
    ghost: 'bg-transparent text-slate-600 active:bg-slate-100 dark:text-slate-300 dark:active:bg-[#171d27]',
    outline: 'border-2 border-[#4f46e5] text-[#4f46e5] active:bg-[#4f46e5]/5 dark:border-[#6d6af7] dark:text-[#c7c5ff] dark:active:bg-[#4f46e5]/10',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
