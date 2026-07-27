import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCategories } from '../api/categories';
import { createDocument } from '../api/documents';
import Button from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { ArrowLeft, Calendar, CheckCircle, FileText, Folder, Upload, X } from 'lucide-react';

function stripExtension(name) {
  return String(name || 'document').replace(/\.[^.]+$/, '').trim() || 'document';
}

function getFileType(file) {
  if (file?.type === 'application/pdf') return 'pdf';
  if (file?.type?.startsWith('image/')) return 'image';
  return 'other';
}

function createBulkItem(file, index) {
  return {
    id: `${Date.now()}-${index}-${file.name}`,
    file,
    name: stripExtension(file.name),
    hasExpiry: false,
    expiryDate: '',
    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
  };
}

export default function BulkUpload() {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId: initialCategoryId = '' } = location.state || {};
  const fileInputRef = useRef(null);

  const [items, setItems] = useState([]);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [summary, setSummary] = useState({ succeeded: 0, failed: [] });

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
        setCategories(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [items]);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    setItems((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      return selected.map((file, index) => createBulkItem(file, index));
    });

    e.target.value = '';
  };

  const updateItem = (itemId, patch) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...patch,
              expiryDate: patch.hasExpiry === false ? '' : item.expiryDate,
            }
          : item
      )
    );
  };

  const removeItem = (itemId) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== itemId);
      const removed = prev.find((item) => item.id === itemId);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const clearAll = () => {
    setItems((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      return [];
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!categoryId) {
      toast('Please select a category', 'error');
      return;
    }

    if (items.length === 0) {
      toast('Please select at least one file', 'error');
      return;
    }

    const invalidItem = items.find((item) => !item.name.trim() || (item.hasExpiry && !item.expiryDate));
    if (invalidItem) {
      toast('Please fill in a name for every file and expiry date where required', 'error');
      return;
    }

    setUploading(true);
    setProgress(0);

    const failed = [];
    let succeeded = 0;

    try {
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('documentName', item.name.trim());
        formData.append('categoryId', categoryId);
        formData.append('fileType', getFileType(item.file));
        formData.append('hasExpiry', item.hasExpiry ? 'true' : 'false');
        if (item.hasExpiry && item.expiryDate) {
          formData.append('expiryDate', item.expiryDate);
        }

        try {
          await createDocument(formData);
          succeeded += 1;
        } catch (error) {
          failed.push(item.file.name);
        }

        setProgress(Math.round(((index + 1) / items.length) * 100));
      }

      setSummary({ succeeded, failed });
      setSuccess(true);
    } catch (error) {
      toast(error.response?.data?.error?.message || 'Bulk upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="page-shell flex flex-col items-center justify-center animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-[#183026] ring-1 ring-emerald-100/80 dark:ring-[#232b38] flex items-center justify-center mb-5">
          <CheckCircle size={44} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Bulk upload completed
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 text-center">
          {summary.succeeded} file(s) saved successfully
        </p>
        {summary.failed.length > 0 && (
          <p className="text-xs text-amber-600 dark:text-amber-300 text-center mb-6 max-w-sm">
            Some files could not be saved: {summary.failed.join(', ')}
          </p>
        )}
        <div className="page-card w-full max-w-xs mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-[#1b2230] text-[#4f46e5] flex items-center justify-center">
            <Folder size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">Bulk upload</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{summary.succeeded} file(s) processed</p>
          </div>
        </div>
        <Button onClick={() => navigate('/')}>Done</Button>
      </div>
    );
  }

  return (
    <div className="page-shell flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate('/documents/add', { state: { categoryId: initialCategoryId || categoryId || null } })}
          className="p-2 rounded-full active:bg-slate-100 dark:active:bg-[#1c2430] text-slate-500 dark:text-slate-300"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <p className="section-label">Documents</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Bulk Upload</h1>
        </div>
      </div>

      <div className="hero-panel mb-4 text-center">
        <div className="mx-auto w-20 h-20 rounded-3xl bg-white/80 dark:bg-[#111821] ring-1 ring-slate-200/80 dark:ring-[#232b38] flex items-center justify-center mb-4">
          <Upload size={36} className="text-[#4f46e5]" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Select all files first, then set a name and expiry for each file below.
        </p>
      </div>

      <div className="page-card flex-1 flex flex-col gap-4">
        <label className="rounded-2xl border-2 border-dashed border-slate-200/90 dark:border-[#2b3240] bg-white/60 dark:bg-[#0f141c] p-5 flex flex-col items-center justify-center cursor-pointer active:bg-slate-50 dark:active:bg-[#171d27] transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-[#1b2230] ring-1 ring-indigo-100/80 dark:ring-[#232b38] flex items-center justify-center mb-4">
            <Upload size={28} className="text-[#4f46e5]" />
          </div>
          <p className="text-slate-700 dark:text-slate-100 font-medium mb-1">Choose Files</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Select multiple PDFs or images, then edit each file below.</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>

        {items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{items.length} file(s) selected</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Name and expiry are saved separately for each file.</p>
              </div>
              <button onClick={clearAll} className="text-xs text-rose-500 font-semibold">
                Clear all
              </button>
            </div>

            <div className="space-y-3 max-h-[46vh] overflow-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200/80 dark:border-[#232b38] bg-white/70 dark:bg-[#0f141c] p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#1b2230] shrink-0 flex items-center justify-center">
                      {item.previewUrl ? (
                        <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileText size={24} className="text-[#4f46e5]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{item.file.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 rounded-full active:bg-slate-100 dark:active:bg-[#1c2430] text-slate-400 dark:text-slate-300"
                          aria-label={`Remove ${item.file.name}`}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="mt-3">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">File name</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, { name: e.target.value })}
                          className="input-field"
                          maxLength={128}
                        />
                      </div>

                      <label className="flex items-center gap-3 mt-3 py-2 px-1 rounded-2xl">
                        <input
                          type="checkbox"
                          checked={item.hasExpiry}
                          onChange={(e) => updateItem(item.id, { hasExpiry: e.target.checked, expiryDate: e.target.checked ? item.expiryDate : '' })}
                          className="w-5 h-5 rounded border-slate-300 text-[#4f46e5] accent-[#4f46e5]"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-300">Has expiry date</span>
                      </label>

                      {item.hasExpiry && (
                        <div className="mt-2">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Expiry date</label>
                          <div className="relative">
                            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="date"
                              value={item.expiryDate}
                              onChange={(e) => updateItem(item.id, { expiryDate: e.target.value })}
                              className="input-field pl-11"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!initialCategoryId ? (
          <div>
            <label className="section-label mb-2 block">Select category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field appearance-none">
              <option value="">Choose a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="page-card-compact">
            <p className="section-label mb-1 block">Category</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {categories.find((cat) => cat._id === initialCategoryId)?.name || 'Selected category'}
            </p>
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <div className="h-2 bg-slate-100 dark:bg-[#1b2230] rounded-full overflow-hidden">
              <div className="h-full bg-[#4f46e5] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">{progress}% uploaded</p>
          </div>
        )}

        <div className="mt-auto pb-4">
          <Button onClick={handleUpload} loading={uploading} disabled={items.length === 0 || !categoryId}>
            Save All Files
          </Button>
        </div>
      </div>
    </div>
  );
}
