import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDocument, deleteDocument } from '../api/documents';
import BottomSheet from '../components/ui/BottomSheet';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { toast } from '../components/ui/Toast';
import { ArrowLeft, Download, Share2, Trash2, FileText, Calendar, Folder, MessageCircle, MoreVertical } from 'lucide-react';
import { buildDocumentFiles, shareDocumentFile } from '../utils/documentShare';

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const previewStageRef = useRef(null);
  const pinchGestureRef = useRef({ startDistance: 0, startScale: 1 });
  const previewScaleRef = useRef(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data } = await getDocument(id);
        if (!cancelled) setDoc(data.data);
      } catch {
        if (!cancelled) {
          toast('Document not found', 'error');
          navigate('/documents');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id, navigate]);

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      await deleteDocument(id);
      toast('Document deleted', 'success');
      navigate(-1);
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Failed to delete', 'error');
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (!doc?.cloudinaryUrl) return;
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
    } catch {
      toast('Unable to prepare a valid PDF download for this document. Please re-upload the original PDF.', 'error');
    }
  };

  const handleViewPdf = async () => {
    if (!doc?.cloudinaryUrl) return;

    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      toast('Popup blocked. Please allow popups to view the PDF.', 'error');
      return;
    }

    try {
      const files = await buildDocumentFiles(doc);
      const file = files[0];
      if (!file) {
        throw new Error('No PDF file available');
      }

      const url = URL.createObjectURL(file);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      previewWindow.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      previewWindow.close();
      toast(err.message || 'Unable to open PDF. Please re-upload the original PDF.', 'error');
    }
  };

  const handleShare = async () => {
    if (!doc) return;
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

  const handleShareWhatsApp = () => {
    if (!doc?.cloudinaryUrl) return;
    const attachments = Array.isArray(doc.attachments) && doc.attachments.length > 0
      ? doc.attachments
      : [{ cloudinaryUrl: doc.cloudinaryUrl, originalName: doc.documentName }];
    const text = `${doc.documentName}\n${attachments
      .map((attachment, index) => `${index + 1}. ${attachment.originalName || doc.documentName}\n${attachment.cloudinaryUrl}`)
      .join('\n\n')}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  useEffect(() => {
    if (previewAttachment) {
      setPreviewScale(1);
      previewScaleRef.current = 1;
      pinchGestureRef.current = { startDistance: 0, startScale: 1 };
    }
  }, [previewAttachment]);

  useEffect(() => {
    previewScaleRef.current = previewScale;
  }, [previewScale]);

  useEffect(() => {
    const stage = previewStageRef.current;
    if (!stage || !previewAttachment) return undefined;

    const clampScale = (value) => Math.min(3, Math.max(1, Number(value.toFixed(2))));
    const getTouchDistance = (touches) => {
      if (touches.length < 2) return 0;
      const [touchA, touchB] = touches;
      return Math.hypot(touchB.clientX - touchA.clientX, touchB.clientY - touchA.clientY);
    };

    const handleWheel = (event) => {
      if (event.cancelable) event.preventDefault();
      setPreviewScale((prev) => {
        const next = event.deltaY < 0 ? prev + 0.15 : prev - 0.15;
        const clamped = clampScale(next);
        previewScaleRef.current = clamped;
        return clamped;
      });
    };

    const handleTouchStart = (event) => {
      if (event.touches.length !== 2) return;
      if (event.cancelable) event.preventDefault();
      pinchGestureRef.current = {
        startDistance: getTouchDistance(event.touches),
        startScale: previewScaleRef.current,
      };
    };

    const handleTouchMove = (event) => {
      if (event.touches.length !== 2 || !pinchGestureRef.current.startDistance) return;
      if (event.cancelable) event.preventDefault();
      const distance = getTouchDistance(event.touches);
      const nextScale = clampScale((distance / pinchGestureRef.current.startDistance) * pinchGestureRef.current.startScale);
      previewScaleRef.current = nextScale;
      setPreviewScale(nextScale);
    };

    const resetPinch = () => {
      pinchGestureRef.current = {
        startDistance: 0,
        startScale: previewScaleRef.current,
      };
    };

    stage.addEventListener('wheel', handleWheel, { passive: false });
    stage.addEventListener('touchstart', handleTouchStart, { passive: false });
    stage.addEventListener('touchmove', handleTouchMove, { passive: false });
    stage.addEventListener('touchend', resetPinch);
    stage.addEventListener('touchcancel', resetPinch);

    return () => {
      stage.removeEventListener('wheel', handleWheel);
      stage.removeEventListener('touchstart', handleTouchStart);
      stage.removeEventListener('touchmove', handleTouchMove);
      stage.removeEventListener('touchend', resetPinch);
      stage.removeEventListener('touchcancel', resetPinch);
    };
  }, [previewAttachment]);

  if (loading) return <LoadingSpinner size="lg" className="min-h-screen" />;
  if (!doc) return null;

  const attachments = Array.isArray(doc.attachments) && doc.attachments.length > 0
    ? doc.attachments
    : [{ cloudinaryUrl: doc.cloudinaryUrl, fileType: doc.fileType, originalName: doc.documentName }];
  const isImage = attachments[0]?.fileType === 'image';
  const attachmentCount = attachments.length;
  const hasMultipleAttachments = attachmentCount > 1;

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-800 dark:bg-[#0f1115] dark:text-slate-100">
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-slate-100/90 bg-[#f6f7fb]/90 backdrop-blur dark:bg-[#0f1115]/90 dark:border-[#232b38]">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full active:bg-slate-100 dark:active:bg-[#1c2430] text-slate-500 dark:text-slate-300"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => setShowActions(true)}
            className="p-2 rounded-full active:bg-slate-100 dark:active:bg-[#1c2430] text-slate-500 dark:text-slate-300"
            aria-label="Actions"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-24 safe-bottom">
        {hasMultipleAttachments ? (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="section-label">Files</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{attachmentCount} files ready to scroll</p>
              </div>
              <span className="text-xs font-semibold text-[#4f46e5] dark:text-indigo-300">{attachmentCount} files</span>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory">
              {attachments.map((attachment, index) => {
                const isAttachmentImage = attachment.fileType === 'image';
                const title = attachment.originalName || `${doc.documentName} ${index + 1}`;

                return (
                  <button
                    key={`${attachment.publicId || attachment.cloudinaryUrl || index}`}
                    onClick={() => {
                      if (isAttachmentImage) {
                        setPreviewAttachment(attachment);
                        return;
                      }
                      window.open(attachment.cloudinaryUrl, '_blank');
                    }}
                    className="snap-start shrink-0 w-[72%] max-w-[280px] card overflow-hidden text-left active:scale-[0.98] transition-transform"
                  >
                    <div className="h-44 bg-slate-100 dark:bg-[#1b2230] overflow-hidden">
                      {isAttachmentImage ? (
                        <img
                          src={attachment.cloudinaryUrl}
                          alt={title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-300">
                          <FileText size={44} className="text-[#4f46e5] dark:text-indigo-300" />
                          <span className="text-sm font-medium capitalize">{attachment.fileType}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Swipe to view all files</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : isImage ? (
          <div className="card p-2 mb-4 cursor-pointer overflow-hidden" onClick={() => setPreviewAttachment(attachments[0])}>
            <img
              src={attachments[0].cloudinaryUrl}
              alt={doc.documentName}
              className="w-full rounded-[20px] object-contain max-h-[50vh]"
              loading="lazy"
            />
          </div>
        ) : attachments[0]?.fileType === 'pdf' && (
          <div className="card p-6 flex flex-col items-center justify-center mb-4">
            <FileText size={48} className="text-[#4f46e5] dark:text-indigo-300 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
              {attachmentCount > 1 ? `${attachmentCount} files in this document` : 'PDF Document'}
            </p>
            <button onClick={handleViewPdf} className="btn-primary max-w-[200px] py-2.5 text-sm">
              {attachmentCount > 1 ? 'View Files' : 'View PDF'}
            </button>
          </div>
        )}

        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{doc.documentName}</h1>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-sm">
            <Folder size={16} className="text-slate-400 dark:text-slate-500" />
            <span className="text-slate-600 dark:text-slate-300">{doc.categoryId?.name || 'Uncategorized'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <FileText size={16} className="text-slate-400 dark:text-slate-500" />
            <span className="text-slate-600 dark:text-slate-300">{doc.fileType}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar size={16} className="text-slate-400 dark:text-slate-500" />
            <span className="text-slate-600 dark:text-slate-300">Added {new Date(doc.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {hasMultipleAttachments && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Use the horizontal scroll above to move through all attached files.
          </p>
        )}
      </div>

      {previewAttachment && previewAttachment.fileType === 'image' && (
        <div
          ref={previewStageRef}
          className="fixed inset-0 z-50 bg-black/95 overflow-auto"
          onClick={() => setPreviewAttachment(null)}
          style={{ touchAction: 'none' }}
        >
          <div className="min-h-full min-w-full flex items-center justify-center p-4">
            <img
              src={previewAttachment.cloudinaryUrl}
              alt={doc.documentName}
              className="max-w-full max-h-full object-contain select-none"
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'center center',
              }}
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />
          </div>
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-2 py-2 text-white">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewScale((prev) => Math.max(1, Number((prev - 0.15).toFixed(2))));
              }}
              className="w-10 h-10 rounded-full active:bg-white/20 flex items-center justify-center"
              aria-label="Zoom out"
            >
              -
            </button>
            <span className="text-xs font-semibold w-12 text-center">{Math.round(previewScale * 100)}%</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewScale((prev) => Math.min(3, Number((prev + 0.15).toFixed(2))));
              }}
              className="w-10 h-10 rounded-full active:bg-white/20 flex items-center justify-center"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewScale(1);
              }}
              className="px-3 h-10 rounded-full active:bg-white/20 text-xs font-semibold"
            >
              Reset
            </button>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPreviewAttachment(null);
            }}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur"
            aria-label="Close preview"
          >
            <ArrowLeft size={22} />
          </button>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in px-6" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="w-full max-w-sm bg-white dark:bg-[#111821] rounded-2xl p-6 animate-slide-up ring-1 ring-slate-200/80 dark:ring-[#232b38]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-[#24161b] flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 text-center mb-2">Delete Document</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300 text-center mb-6">
              Are you sure you want to delete this document permanently?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-[#171d27] text-slate-600 dark:text-slate-200 font-semibold text-sm active:bg-slate-200 dark:active:bg-[#1f2632]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm active:bg-red-600 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomSheet open={showActions} onClose={() => setShowActions(false)}>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              handleDownload();
              setShowActions(false);
            }}
            className="flex items-center gap-3 w-full py-3.5 px-4 rounded-xl active:bg-slate-50 dark:active:bg-[#171d27] text-slate-700 dark:text-slate-200"
          >
            <Download size={20} /> Download
          </button>
          <button
            onClick={() => {
              handleShare();
              setShowActions(false);
            }}
            className="flex items-center gap-3 w-full py-3.5 px-4 rounded-xl active:bg-slate-50 dark:active:bg-[#171d27] text-slate-700 dark:text-slate-200"
          >
            <Share2 size={20} /> Share
          </button>
          <button
            onClick={() => {
              handleShareWhatsApp();
              setShowActions(false);
            }}
            className="flex items-center gap-3 w-full py-3.5 px-4 rounded-xl active:bg-slate-50 dark:active:bg-[#171d27] text-emerald-600 dark:text-emerald-400"
          >
            <MessageCircle size={20} /> Share to WhatsApp
          </button>
          <button
            onClick={() => {
              setShowActions(false);
              setShowDeleteConfirm(true);
            }}
            className="flex items-center gap-3 w-full py-3.5 px-4 rounded-xl active:bg-slate-50 dark:active:bg-[#171d27] text-red-500"
          >
            <Trash2 size={20} /> Delete
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
