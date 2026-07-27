import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PinInput from '../components/ui/PinInput';
import Button from '../components/ui/Button';
import SOSCountdown from '../components/sos/SOSCountdown';
import { sendSOSAlert } from '../utils/sos';
import { toast } from '../components/ui/Toast';
import { AlertTriangle } from 'lucide-react';

export default function Login() {
  const { login, appName } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const navigate = useNavigate();

  const handleUnlock = async () => {
    if (pin.length !== 4) {
      setError('Please enter your PIN');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(pin);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error?.message || 'Something went wrong';
      setError(msg);
      setPin('');
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSOSComplete = async () => {
    try {
      await sendSOSAlert();
      toast('Emergency email sent successfully', 'success');
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Failed to send SOS', 'error');
      throw err;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col safe-top bg-[#f6f7fb] text-slate-800 dark:bg-[#0f1115] dark:text-slate-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <img
          src="/lock-screen-photo.jpeg"
          alt="Family photo"
          className="w-[min(92vw,420px)] h-auto max-h-[38vh] object-contain rounded-2xl mb-5"
        />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">{appName}</h1>
        <p className="text-slate-400 dark:text-slate-400 text-sm mb-8 text-center">
          Enter PIN to unlock your vault
        </p>

        <PinInput
          key="login"
          onComplete={setPin}
          disabled={loading}
          error={error}
        />

        <div className="mt-6 w-full">
          <Button
            variant="primary"
            onClick={handleUnlock}
            loading={loading}
            disabled={pin.length < 4}
          >
            Unlock
          </Button>
        </div>

        <div className="flex items-center gap-3 my-8 w-full">
          <div className="flex-1 h-px bg-slate-200 dark:bg-[#232b38]" />
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">OR</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-[#232b38]" />
        </div>

        <button
          onClick={() => setShowSOS(true)}
          className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl border-2 border-red-200 dark:border-red-500/30 text-red-500 dark:text-red-400 font-semibold active:bg-red-50 dark:active:bg-[#24161b] transition-colors"
        >
          <AlertTriangle size={18} /> SOS Emergency
        </button>
      </div>

      {showSOS && (
        <SOSCountdown onComplete={handleSOSComplete} onCancel={() => setShowSOS(false)} />
      )}
    </div>
  );
}
