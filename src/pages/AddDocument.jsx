import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { ArrowLeft, Folder, Upload } from 'lucide-react';

export default function AddDocument() {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId = null } = location.state || {};
  const [mode, setMode] = useState(null);
  const [docName, setDocName] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');

  const handleNext = () => {
    if (!docName.trim()) return;
    navigate('/documents/add/method', {
      state: {
        documentName: docName.trim(),
        hasExpiry,
        expiryDate: hasExpiry ? expiryDate : null,
        categoryId,
      },
    });
  };

  return (
    <div className="page-shell flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => {
            if (mode) {
              setMode(null);
              return;
            }
            navigate('/');
          }}
          className="p-2 rounded-full active:bg-slate-100 dark:active:bg-[#1c2430] text-slate-500 dark:text-slate-300"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <p className="section-label">Documents</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Add Document</h1>
        </div>
      </div>

      {!mode && (
        <div className="page-card">
          <p className="section-label mb-3 block">Choose upload type</p>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setMode('single')}
              className="flex items-center gap-4 rounded-2xl border border-slate-200/80 dark:border-[#232b38] bg-white/70 dark:bg-[#0f141c] p-4 text-left active:scale-[0.99] transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-[#1b2230] ring-1 ring-indigo-100/80 dark:ring-[#232b38] flex items-center justify-center shrink-0">
                <Upload size={22} className="text-[#4f46e5]" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Single upload</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Add one document at a time</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/documents/add/bulk', { state: { categoryId } })}
              className="flex items-center gap-4 rounded-2xl border border-slate-200/80 dark:border-[#232b38] bg-white/70 dark:bg-[#0f141c] p-4 text-left active:scale-[0.99] transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[#183026] ring-1 ring-emerald-100/80 dark:ring-[#232b38] flex items-center justify-center shrink-0">
                <Folder size={22} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">Bulk upload</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Add multiple files with separate names and expiry</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {mode === 'single' && (
        <div id="single-upload-form" className="page-card flex-1 flex flex-col gap-4">
        <div>
          <p className="section-label mb-1 block">Single upload</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Give the document a name and expiry, then continue with the current single-file flow.
          </p>
        </div>

        <div>
          <label className="section-label mb-2 block">Document name</label>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="e.g. Father Aadhaar"
            className="input-field text-center text-lg"
            maxLength={128}
            autoFocus
          />
        </div>

        <label className="flex items-center gap-3 py-2 px-1 rounded-2xl">
          <input
            type="checkbox"
            checked={hasExpiry}
            onChange={(e) => setHasExpiry(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-[#4f46e5] accent-[#4f46e5]"
          />
          <span className="text-sm text-slate-600 dark:text-slate-300">Has expiry date</span>
        </label>

        {hasExpiry && (
          <div>
            <label className="section-label mb-2 block">Expiry date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="input-field"
            />
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-2">
              Email reminders will be sent 15, 7, 3, 2, and 1 day(s) before expiry.
            </p>
          </div>
        )}

        <div className="mt-auto pt-2">
          <Button onClick={handleNext} disabled={!docName.trim() || (hasExpiry && !expiryDate)}>
            Next
          </Button>
        </div>
        </div>
      )}
    </div>
  );
}
