import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';
import { ArrowLeft, Upload, Camera } from 'lucide-react';

export default function ChooseMethod() {
  const navigate = useNavigate();
  const location = useLocation();
  const { documentName = '', hasExpiry = false, expiryDate = null, categoryId = null } = location.state || {};
  const sharedState = { documentName, hasExpiry, expiryDate, categoryId };

  return (
    <div className="page-shell flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate('/documents/add')} className="p-2 rounded-full active:bg-slate-100 dark:active:bg-[#1c2430] text-slate-500 dark:text-slate-300" aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <div>
          <p className="section-label">Add Document</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{documentName || 'Choose method'}</h1>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Choose how you want to add the document.</p>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => navigate('/documents/add/upload', { state: sharedState })}
          className="card p-5 flex items-center gap-4 active:scale-[0.98] transition-transform text-left"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-[#1b2230] ring-1 ring-indigo-100/80 dark:ring-[#232b38] flex items-center justify-center shrink-0">
            <Upload size={26} className="text-[#4f46e5]" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-800 dark:text-slate-100">Upload File</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Upload PDF, JPG or PNG</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/documents/add/scan', { state: sharedState })}
          className="card p-5 flex items-center gap-4 active:scale-[0.98] transition-transform text-left"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#183026] ring-1 ring-emerald-100/80 dark:ring-[#232b38] flex items-center justify-center shrink-0">
            <Camera size={26} className="text-emerald-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-800 dark:text-slate-100">Scan Document</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Use camera to scan document</p>
          </div>
        </button>
      </div>

      <div className="mt-auto pt-8 pb-4">
        <Button variant="ghost" onClick={() => navigate('/')}>Cancel</Button>
      </div>
    </div>
  );
}
