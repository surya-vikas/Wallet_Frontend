import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/80 dark:bg-[#111821] ring-1 ring-slate-200/80 dark:ring-[#232b38] flex items-center justify-center mb-4 shadow-sm">
        <Icon size={32} className="text-slate-300 dark:text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-xs">{message}</p>
      {action}
    </div>
  );
}
