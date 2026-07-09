import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

let toastId = 0;

export function toast(message, type = 'success') {
  const event = new CustomEvent('show-toast', {
    detail: { id: ++toastId, message, type }
  });
  window.dispatchEvent(event);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((e) => {
    const { id, message, type } = e.detail;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    window.addEventListener('show-toast', addToast);
    return () => window.removeEventListener('show-toast', addToast);
  }, [addToast]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: AlertCircle,
  };

  const colors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-[#5B3FD4]',
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2 max-w-lg mx-auto">
      {toasts.map(({ id, message, type }) => {
        const Icon = icons[type];
        return (
          <div key={id} className={`${colors[type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up`}>
            <Icon size={20} className="shrink-0" />
            <span className="text-sm font-medium flex-1">{message}</span>
            <button onClick={() => setToasts((prev) => prev.filter((t) => t.id !== id))} className="shrink-0">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
