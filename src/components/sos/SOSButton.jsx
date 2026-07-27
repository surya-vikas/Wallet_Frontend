import { useState } from 'react';
import { sendSOSAlert } from '../../utils/sos';
import SOSCountdown from './SOSCountdown';
import { AlertTriangle } from 'lucide-react';
import { toast } from '../ui/Toast';

export default function SOSButton() {
  const [showCountdown, setShowCountdown] = useState(false);

  const handleComplete = async () => {
    try {
      await sendSOSAlert();
      toast('Emergency alert sent', 'success');
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Failed to send SOS', 'error');
      throw err;
    }
  };

  return (
    <>
      <button
        onClick={() => setShowCountdown(true)}
        className="w-full bg-red-600 text-white font-bold py-4 px-6 rounded-xl active:bg-red-700 transition-colors flex items-center justify-center gap-2"
      >
        <AlertTriangle size={20} /> SOS Emergency
      </button>
      {showCountdown && (
        <SOSCountdown onComplete={handleComplete} onCancel={() => setShowCountdown(false)} />
      )}
    </>
  );
}
