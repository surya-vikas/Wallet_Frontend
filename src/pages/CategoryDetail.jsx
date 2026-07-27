import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDocuments, deleteDocument, toggleFavorite } from '../api/documents';
import { getCategory } from '../api/categories';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { toast } from '../components/ui/Toast';
import { ArrowLeft, Search, Plus, FileText, Trash2, Share2, AlertTriangle } from 'lucide-react';
import NotificationBell from '../components/notifications/NotificationBell';
import SOSCountdown from '../components/sos/SOSCountdown';
import { sendSOSAlert } from '../utils/sos';
import { buildDocumentFiles, shareDocumentFile } from '../utils/documentShare';

export default function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showSOS, setShowSOS] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [catRes, docsRes] = await Promise.all([
          getCategory(id),
          getDocuments({ categoryId: id, limit: 100 }),
        ]);
        if (!cancelled) {
          setCategory(catRes.data.data);
          setDocuments(docsRes.data.data);
        }
      } catch {
        if (!cancelled) {
          toast('Failed to load category', 'error');
          navigate('/');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id, navigate]);

  const filtered = documents.filter((d) =>
    d.documentName.toLowerCase().includes(search.toLowerCase())
  );

  const handleShare = async (doc) => {
    try {
      const result = await shareDocumentFile(doc);
      if (result.mode === 'shared') {
        toast('Document shared', 'success');
      } else {
        toast('Sharing is not supported here, so the file was downloaded instead', 'info');
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      toast(err.message || 'Failed to share document', 'error');
    }
  };

  const handleDownload = async (doc) => {
    try {
      const files = await buildDocumentFiles(doc);
      files.forEach((file) => {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      toast(err.message || 'Unable to prepare a valid download', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument(deleteTarget);
      setDocuments((prev) => prev.filter((d) => d._id !== deleteTarget));
      toast('Document deleted', 'success');
    } catch {
      toast('Failed to delete', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;

  return (
    <div className="page-shell">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/')} className="p-2 rounded-full active:bg-slate-100 dark:active:bg-[#1c2430] text-slate-500 dark:text-slate-300" aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="section-label">Category</p>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white truncate">{category?.name || 'Category'}</h1>
        </div>
        <NotificationBell />
        <button onClick={() => setShowSOS(true)} className="p-2 rounded-full active:bg-red-50 dark:active:bg-[#1c2430] text-slate-400 dark:text-slate-300 hover:text-red-500 transition-colors" aria-label="SOS">
          <AlertTriangle size={20} />
        </button>
      </div>

      <div className="card-flat mb-4 p-3">
        <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents..."
          className="input-field pl-11"
        />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="page-card">
          <EmptyState
            icon={FileText}
            title={search ? 'No documents found' : 'No documents yet'}
            message={search ? 'Try a different search term' : 'Add your first document to this category'}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((doc) => (
            <div
              key={doc._id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/documents/${doc._id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(`/documents/${doc._id}`);
              }}
              className="card-flat p-3 flex items-center gap-3 cursor-pointer active:bg-slate-50 dark:active:bg-[#171d27] transition-colors"
            >
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-[#1b2230] text-[#4f46e5] flex items-center justify-center shrink-0 ring-1 ring-indigo-100/80 dark:ring-[#232b38]">
                <FileText size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{doc.documentName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{doc.fileType}</p>
                {Array.isArray(doc.attachments) && doc.attachments.length > 1 && (
                  <p className="text-[11px] text-[#4f46e5] dark:text-indigo-300 font-medium mt-1">
                    {doc.attachments.length} files
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); handleShare(doc); }} className="p-2 rounded-xl active:bg-slate-100 dark:active:bg-[#1c2430] text-slate-400 dark:text-slate-300" aria-label="Share">
                  <Share2 size={18} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDownload(doc); }} className="p-2 rounded-xl active:bg-slate-100 dark:active:bg-[#1c2430] text-slate-400 dark:text-slate-300" aria-label="Download">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(doc._id); }} className="p-2 rounded-xl active:bg-red-50 dark:active:bg-[#24161b] text-slate-400 hover:text-red-500" aria-label="Delete">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => navigate('/documents/add', { state: { categoryId: id } })}
        className="fab"
        aria-label="Add document"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {showSOS && (
        <SOSCountdown
          onComplete={async () => {
            try {
              await sendSOSAlert();
              toast('Emergency alert sent', 'success');
            } catch (err) {
              toast(err.response?.data?.error?.message || 'Failed', 'error');
              throw err;
            }
          }}
          onCancel={() => setShowSOS(false)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-sm animate-fade-in px-6" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm bg-white/98 dark:bg-[#111821] rounded-[28px] p-6 animate-slide-up ring-1 ring-slate-200/80 dark:ring-[#232b38]" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-[#24161b] flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 text-center mb-2">Delete Document</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300 text-center mb-6">Are you sure you want to delete this document permanently?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-[#171d27] text-slate-600 dark:text-slate-200 font-semibold text-sm active:bg-slate-200 dark:active:bg-[#1f2632]">
                Cancel
              </button>
              <button onClick={confirmDelete} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm active:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
