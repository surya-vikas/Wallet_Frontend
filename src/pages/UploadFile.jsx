import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCategories } from '../api/categories';
import { createDocument } from '../api/documents';
import Button from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { ArrowLeft, Upload, CheckCircle, FileText, X } from 'lucide-react';

export default function UploadFile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { documentName = '', hasExpiry = false, expiryDate = null, categoryId: initialCategoryId = '' } = location.state || {};
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);

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
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    previews.forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });

    setFiles(selected);
    setPreviews(
      selected.map((file) => (file.type.startsWith('image/') ? URL.createObjectURL(file) : null))
    );
  };

  const removeSelectedFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed);
      return next;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resolveBundleFileType = (selectedFiles) => {
    const types = new Set(
      selectedFiles.map((file) => {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type === 'application/pdf') return 'pdf';
        return 'other';
      })
    );

    if (types.size === 1) {
      return [...types][0];
    }

    return 'other';
  };

  const handleUpload = async () => {
    if (files.length === 0 || !categoryId) {
      toast('Please select at least one file and a category', 'error');
      return;
    }
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('documentName', documentName);
      formData.append('categoryId', categoryId);
      formData.append('fileType', resolveBundleFileType(files));
      formData.append('hasExpiry', hasExpiry ? 'true' : 'false');
      if (hasExpiry && expiryDate) {
        formData.append('expiryDate', expiryDate);
      }

      await createDocument(formData, {
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          setProgress(Math.min(Math.round((evt.loaded / evt.total) * 100), 99));
        },
      });

      setTimeout(() => setSuccess(true), 300);
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Upload failed', 'error');
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
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Document saved successfully</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 text-center">
          {files.length} file(s) saved together under {documentName}
        </p>
        <div className="page-card w-full max-w-xs mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-[#1b2230] text-[#4f46e5] flex items-center justify-center">
            <Upload size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{documentName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{files.map((f) => f.name).join(', ')}</p>
          </div>
        </div>
        <Button onClick={() => navigate('/')}>Done</Button>
      </div>
    );
  }

  return (
    <div className="page-shell flex flex-col">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full active:bg-slate-100 dark:active:bg-[#1c2430] text-slate-500 dark:text-slate-300" aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <div>
          <p className="section-label">Documents</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Upload File</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        {files.length === 0 ? (
          <label className="page-card p-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-200/90 dark:border-[#2b3240] cursor-pointer active:bg-slate-50 dark:active:bg-[#171d27] transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-[#1b2230] ring-1 ring-indigo-100/80 dark:ring-[#232b38] flex items-center justify-center mb-4">
              <Upload size={28} className="text-[#4f46e5]" />
            </div>
            <p className="text-slate-700 dark:text-slate-100 font-medium mb-1">Choose Files</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">Select one or more PDFs or images. Each file will use the same document name.</p>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf" onChange={handleFileSelect} className="hidden" />
          </label>
        ) : (
          <div className="page-card">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{files.length} file(s) selected</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">All files will be saved under the same document name.</p>
              </div>
              <button
                onClick={() => {
                  setFiles([]);
                  setPreviews((prev) => {
                    prev.forEach((url) => {
                      if (url) URL.revokeObjectURL(url);
                    });
                    return [];
                  });
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-xs text-rose-500 font-semibold"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {files.map((selectedFile, index) => (
                <div key={`${selectedFile.name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 dark:border-[#232b38] p-3 bg-white/70 dark:bg-[#0f141c]">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#1b2230] shrink-0 flex items-center justify-center">
                    {previews[index] ? (
                      <img src={previews[index]} alt={selectedFile.name} className="w-full h-full object-cover" />
                    ) : (
                      <FileText size={24} className="text-[#4f46e5]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <button onClick={() => removeSelectedFile(index)} className="p-2 rounded-full active:bg-slate-100 dark:active:bg-[#1c2430] text-slate-400 dark:text-slate-300" aria-label={`Remove ${selectedFile.name}`}>
                    <X size={18} />
                  </button>
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
                <option key={cat._id} value={cat._id}>{cat.name}</option>
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
          <Button onClick={handleUpload} loading={uploading} disabled={files.length === 0 || !categoryId}>
            {files.length > 1 ? 'Save Files' : 'Save Document'}
          </Button>
        </div>
      </div>
    </div>
  );
}
