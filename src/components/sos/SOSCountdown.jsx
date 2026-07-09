import { useState, useEffect, useRef } from 'react';
import { CheckCircle, X } from 'lucide-react';

export default function SOSCountdown({ onComplete, onCancel }) {
  const [count, setCount] = useState(5);
  const [status, setStatus] = useState('countdown');
  const [errorMessage, setErrorMessage] = useState('');
  const cancelled = useRef(false);
  const started = useRef(false);

  useEffect(() => {
    if (count === 0 && !started.current) {
      started.current = true;
      setStatus('sending');
      let active = true;
      (async () => {
        try {
          await onComplete?.();
          if (active) setStatus('success');
        } catch (err) {
          if (active) {
            setErrorMessage(err?.response?.data?.error?.message || err?.message || 'Failed to send SOS');
            setStatus('error');
          }
        }
      })();
      return () => { active = false; };
    }
    const timer = setTimeout(() => {
      if (!cancelled.current) setCount((c) => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [count]);

  if (status === 'sending') {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-[#15171d] flex flex-col items-center justify-center animate-fade-in px-8" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-[#2a2d36] flex items-center justify-center mb-5">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Sending Emergency Alert</h2>
        <p className="text-slate-500 dark:text-slate-300 text-sm text-center mb-8">
          Your emergency alert is being delivered now.
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-[#15171d] flex flex-col items-center justify-center animate-fade-in px-8" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-[#243428] flex items-center justify-center mb-5">
          <CheckCircle size={44} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Emergency Alert Sent</h2>
        <p className="text-slate-500 dark:text-slate-300 text-sm text-center mb-8">
          Emergency alert with your device details and location has been sent.
        </p>
        <button onClick={onCancel} className="btn-primary max-w-[200px]">Done</button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-[#15171d] flex flex-col items-center justify-center animate-fade-in px-8" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-[#312227] flex items-center justify-center mb-5">
          <X size={44} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Emergency Alert Failed</h2>
        <p className="text-slate-500 dark:text-slate-300 text-sm text-center mb-2">{errorMessage}</p>
        <button onClick={onCancel} className="btn-primary max-w-[200px]">Close</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#15171d] flex flex-col items-center justify-center animate-fade-in px-8" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-[#312227] flex items-center justify-center mb-5">
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 2L2 19h20L12 2z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 8v4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Emergency Alert</h2>
      <p className="text-slate-500 dark:text-slate-300 text-sm mb-8">Sending emergency message in...</p>
      <div className="text-7xl font-black text-red-500 leading-none mb-8">{count}</div>
      <button
        onClick={() => { cancelled.current = true; onCancel?.(); }}
        className="flex items-center gap-2 bg-slate-100 dark:bg-[#2a2d36] text-slate-600 dark:text-slate-300 px-8 py-3.5 rounded-xl font-semibold active:bg-slate-200 dark:active:bg-[#343844] transition-colors"
      >
        <X size={20} /> Cancel
      </button>
    </div>
  );
}
