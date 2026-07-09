import { FileText, Image, File, Star } from 'lucide-react';

const fileTypeIcons = {
  pdf: FileText,
  image: Image,
  doc: File,
  spreadsheet: File,
  other: File,
};

const fileTypeColors = {
  pdf: 'text-red-400 bg-red-900/30',
  image: 'text-emerald-400 bg-emerald-900/30',
  doc: 'text-blue-400 bg-blue-900/30',
  spreadsheet: 'text-yellow-400 bg-yellow-900/30',
  other: 'text-slate-400 bg-slate-700/50',
};

export default function DocumentCard({ doc, onClick, onFavorite }) {
  const Icon = fileTypeIcons[doc.fileType] || File;
  const colorClass = fileTypeColors[doc.fileType] || fileTypeColors.other;
  const attachmentCount = Array.isArray(doc.attachments) && doc.attachments.length > 0 ? doc.attachments.length : 1;

  return (
    <div
      className="card flex items-center gap-4 active:scale-[0.98] cursor-pointer transition-transform p-4"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(); }}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{doc.documentName}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {doc.categoryId?.name || 'Uncategorized'}
          {doc.hasExpiry && doc.expiryDate && <span className="ml-2 text-rose-500 dark:text-rose-400">Expires {new Date(doc.expiryDate).toLocaleDateString()}</span>}
        </p>
        {attachmentCount > 1 && (
          <p className="text-[11px] text-[#4f46e5] dark:text-indigo-300 mt-1 font-medium">
            {attachmentCount} files
          </p>
        )}
      </div>
      {onFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onFavorite(doc._id); }}
          className="p-2 rounded-full active:bg-slate-100 dark:active:bg-[#1c2430]"
          aria-label={doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star size={18} className={doc.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-500 dark:text-slate-400'} />
        </button>
      )}
    </div>
  );
}
