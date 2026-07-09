import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/45 backdrop-blur-sm animate-fade-in px-4" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="w-full max-w-lg bg-white/98 dark:bg-[#111821] rounded-[28px] sm:rounded-[32px] max-h-[85vh] overflow-y-auto animate-slide-up ring-1 ring-slate-200/80 dark:ring-[#232b38]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="sticky top-0 bg-white/95 dark:bg-[#111821]/95 backdrop-blur flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#232b38]">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full active:bg-slate-100 dark:active:bg-[#1c2430] text-slate-400 dark:text-slate-300" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
