import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import jsPDF from 'jspdf';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  GripVertical,
  Loader2,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import api from '../api/axios';
import { getCategories } from '../api/categories';
import Button from '../components/ui/Button';
import { toast } from '../components/ui/Toast';

function SortablePage({ page, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white dark:bg-[#22252d] rounded-xl p-3 border border-slate-100 dark:border-[#343844]"
      {...attributes}
    >
      <button className="touch-none text-slate-400 dark:text-slate-300 p-1" {...listeners}>
        <GripVertical size={18} />
      </button>
      <div className="w-12 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-[#2c3039] shrink-0">
        <img src={page.data} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
      </div>
      <span className="text-sm text-slate-600 dark:text-slate-200 flex-1">Page {index + 1}</span>
      <button
        onClick={() => onRemove(index)}
        className="p-1.5 rounded-full active:bg-slate-100 dark:active:bg-[#2f3440] text-red-400"
        aria-label="Remove page"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default function ScanDocument() {
  const navigate = useNavigate();
  const location = useLocation();
  const captureInputRef = useRef(null);
  const webcamRef = useRef(null);

  const { documentName: docName, hasExpiry = false, expiryDate = null, categoryId: initialCategoryId = '' } = location.state || {};
  const documentName = docName || `Scanned ${new Date().toLocaleDateString()}`;

  const [pages, setPages] = useState([]);
  const [showCamera, setShowCamera] = useState(true);
  const [cameraError, setCameraError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState('scan');
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [categories, setCategories] = useState([]);

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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPages((prev) => [...prev, { id: `page-${Date.now()}`, data: imageSrc }]);
    }
  }, []);

  const handleNativeCapture = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result;
      if (typeof data === 'string') {
        setPages((prev) => [...prev, { id: `page-${Date.now()}`, data }]);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }, []);

  const removePage = useCallback((index) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPages((prev) => {
      const oldIdx = prev.findIndex((p) => p.id === active.id);
      const newIdx = prev.findIndex((p) => p.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }, []);

  const loadImage = useCallback(
    (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      }),
    []
  );

  const getImageFormat = (dataUrl) => {
    if (dataUrl?.startsWith('data:image/png')) return 'PNG';
    if (dataUrl?.startsWith('data:image/webp')) return 'WEBP';
    return 'JPEG';
  };

  const generateAndUpload = async () => {
    if (pages.length === 0) {
      toast('Capture at least one page', 'error');
      return;
    }

    setProcessing(true);
    setStep('processing');

    try {
      const firstImage = await loadImage(pages[0].data);
      const firstOrientation = firstImage.width >= firstImage.height ? 'landscape' : 'portrait';
      const pdf = new jsPDF({
        orientation: firstOrientation,
        unit: 'px',
        format: [firstImage.width, firstImage.height],
      });

      pdf.addImage(
        pages[0].data,
        getImageFormat(pages[0].data),
        0,
        0,
        firstImage.width,
        firstImage.height
      );

      for (let i = 1; i < pages.length; i += 1) {
        const img = await loadImage(pages[i].data);
        const orientation = img.width >= img.height ? 'landscape' : 'portrait';
        pdf.addPage([img.width, img.height], orientation);
        pdf.addImage(
          pages[i].data,
          getImageFormat(pages[i].data),
          0,
          0,
          img.width,
          img.height
        );
      }

      const blob = pdf.output('blob');
      const file = new File([blob], `${documentName.replace(/\s+/g, '-')}.pdf`, {
        type: 'application/pdf',
      });

      setProcessing(false);
      setStep('uploading');
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentName', documentName);
      formData.append('categoryId', categoryId || undefined);
      formData.append('fileType', 'pdf');
      formData.append('hasExpiry', hasExpiry ? 'true' : 'false');
      if (hasExpiry && expiryDate) {
        formData.append('expiryDate', expiryDate);
      }

      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploading(false);
      setStep('success');
    } catch (err) {
      setProcessing(false);
      setUploading(false);
      setStep('scan');
      toast(err.response?.data?.error?.message || 'Failed to create document', 'error');
    }
  };

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-white dark:bg-[#15171d] flex flex-col items-center justify-center px-6 transition-colors duration-200">
        <Loader2 size={48} className="text-[#5B3FD4] animate-spin mb-5" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Combining Pages...</h2>
        <p className="text-slate-400 dark:text-slate-300 text-sm">Generating PDF from {pages.length} page(s)</p>
      </div>
    );
  }

  if (step === 'uploading') {
    return (
      <div className="min-h-screen bg-white dark:bg-[#15171d] flex flex-col items-center justify-center px-6 transition-colors duration-200">
        <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-[#2a2d36] flex items-center justify-center mb-5">
          <Loader2 size={32} className="text-[#5B3FD4] animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Uploading...</h2>
        <p className="text-slate-400 dark:text-slate-300 text-sm">Saving your document to the vault</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white dark:bg-[#15171d] flex flex-col items-center justify-center px-6 animate-fade-in transition-colors duration-200">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-[#224033] flex items-center justify-center mb-5">
          <CheckCircle size={44} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Document saved successfully</h2>
        <p className="text-slate-400 dark:text-slate-300 text-sm mb-8">
          {documentName} ({pages.length} pages)
        </p>
        <div className="card p-4 w-full max-w-xs mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-[#2a2d36] text-blue-600 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{documentName}</p>
            <p className="text-xs text-slate-400 dark:text-slate-300">PDF - {pages.length} pages</p>
          </div>
        </div>
        <Button onClick={() => navigate('/')}>Done</Button>
      </div>
    );
  }

  const videoConstraints = {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  };

  const cameraFallback = (
    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-[#3a3f4c] bg-slate-50 dark:bg-[#1d2027] p-4 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-white dark:bg-[#2a2d36] flex items-center justify-center mb-3">
        <TriangleAlert size={22} className="text-amber-500" />
      </div>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Camera could not start</p>
      <p className="text-xs text-slate-500 dark:text-slate-300 mb-4">
        Allow camera permission, and make sure the site is opened in a secure context.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => window.location.reload()}
          className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-[#2a2d36] text-slate-700 dark:text-slate-200 font-semibold text-sm active:bg-slate-200 dark:active:bg-[#323744] inline-flex items-center justify-center gap-2"
        >
          <RefreshCw size={16} />
          Retry
        </button>
        <button
          onClick={() => captureInputRef.current?.click()}
          className="flex-1 py-3 rounded-xl bg-[#5B3FD4] text-white font-semibold text-sm active:bg-[#4c35b0]"
        >
          Take Photo
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#15171d] flex flex-col transition-colors duration-200">
      <input
        ref={captureInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleNativeCapture}
      />

      <div className="sticky top-0 z-10 bg-white dark:bg-[#15171d] flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[#2d313b]">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full active:bg-slate-100 dark:active:bg-[#2a2d36] text-slate-500 dark:text-slate-300"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Scan Document</h1>
        <div className="w-10" />
      </div>

      {showCamera && (
        <div className="relative bg-black">
          <Webcam
            ref={webcamRef}
            audio={false}
            mirrored={false}
            playsInline
            muted
            forceScreenshotSourceSize
            screenshotFormat="image/jpeg"
            screenshotQuality={0.9}
            videoConstraints={videoConstraints}
            onUserMedia={() => setCameraError('')}
            onUserMediaError={() => {
              setCameraError('Camera permission blocked or the browser cannot access the camera.');
            }}
            className="w-full h-[35vh] object-cover"
          />
          <div className="absolute inset-0 border-2 border-white/30 m-4 rounded-xl pointer-events-none" />
          <button
            onClick={capture}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white bg-white/20 active:bg-white/40 transition-colors"
            aria-label="Capture page"
          />
        </div>
      )}

      <div className="flex-1 flex flex-col px-4 pt-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">Pages ({pages.length})</h2>
          <button
            onClick={() => setShowCamera((prev) => !prev)}
            className="text-sm text-[#5B3FD4] font-medium flex items-center gap-1"
          >
            <Camera size={16} />
            {showCamera ? 'Hide' : 'Show'} Camera
          </button>
        </div>

        {cameraError && showCamera && (
          <div className="mb-3">{cameraFallback}</div>
        )}

        {!showCamera && (
          <div className="mb-3 rounded-2xl border border-slate-200 dark:border-[#3a3f4c] bg-slate-50 dark:bg-[#1d2027] p-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
              Camera is hidden. Use the button below to take a photo with your phone camera.
            </p>
            <button
              onClick={() => captureInputRef.current?.click()}
              className="w-full py-3 rounded-xl bg-[#5B3FD4] text-white font-semibold text-sm active:bg-[#4c35b0]"
            >
              Take Photo
            </button>
          </div>
        )}

        {pages.length > 0 ? (
          <div className="flex flex-col gap-2 flex-1">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                {pages.map((page, idx) => (
                  <SortablePage key={page.id} page={page} index={idx} onRemove={removePage} />
                ))}
              </SortableContext>
            </DndContext>

            <div className="mt-3">
              {!initialCategoryId ? (
                <>
                  <label className="text-sm text-slate-500 dark:text-slate-300 mb-1 block">Category (optional)</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="input-field appearance-none mb-3"
                  >
                    <option value="">Select category</option>
                    {Array.isArray(categories) ? categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    )) : null}
                  </select>
                </>
              ) : (
                <div className="page-card-compact mb-3">
                  <p className="section-label mb-1 block">Category</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {categories.find((cat) => cat._id === initialCategoryId)?.name || 'Selected category'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-300 text-sm">
            Capture pages using the camera above
          </div>
        )}

        {pages.length > 0 && (
          <div className="py-4">
            <Button onClick={generateAndUpload} loading={processing || uploading}>
              Convert to PDF & Save
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
