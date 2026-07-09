import { useEffect } from 'react';

export default function BottomSheet({ open, onClose, children }) {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-sm animate-fade-in px-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white/98 dark:bg-[#111821] rounded-t-[28px] animate-slide-up ring-1 ring-slate-200/80 dark:ring-[#232b38]" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>
        <div className="px-5 pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}
