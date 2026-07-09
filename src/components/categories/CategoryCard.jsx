import { Folder, Pencil } from 'lucide-react';

export default function CategoryCard({ category, onClick, onEdit }) {
  return (
    <div
      className="card relative flex flex-col items-center justify-center gap-2 min-h-[132px] p-4 active:scale-[0.98] cursor-pointer transition-transform"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(); }}
    >
      {onEdit && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(category); }}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/90 dark:bg-[#1b2230]/95 text-slate-500 dark:text-slate-300 shadow-sm active:bg-slate-100 dark:active:bg-[#232b38]"
          aria-label={`Edit ${category.name}`}
        >
          <Pencil size={14} />
        </button>
      )}
      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-[#1b2230] ring-1 ring-indigo-100/80 dark:ring-[#232b38] flex items-center justify-center shrink-0 overflow-hidden">
        <Folder size={24} className="text-[#4f46e5] dark:text-indigo-300" />
      </div>
      <div className="min-w-0 text-center">
        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">{category.name}</p>
        {category.documentCount !== undefined && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{category.documentCount} document(s)</p>
        )}
      </div>
    </div>
  );
}
