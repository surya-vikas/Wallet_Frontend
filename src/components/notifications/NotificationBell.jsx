import { useState, useEffect, useCallback } from 'react';
import { Bell, Calendar, X } from 'lucide-react';
import { getNotifications, markNotificationsRead } from '../../api/notifications';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getNotifications();
      setNotifications(data.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpen = async () => {
    setOpen(true);
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n._id);
    if (unreadIds.length > 0) {
      try {
        await markNotificationsRead(unreadIds);
        setNotifications((prev) => prev.map((n) => (unreadIds.includes(n._id) ? { ...n, read: true } : n)));
      } catch { /* ignore */ }
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full active:bg-slate-100 dark:active:bg-[#1c2430] text-slate-500 dark:text-slate-300"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-sm animate-fade-in px-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-lg bg-white/98 dark:bg-[#111821] rounded-t-[28px] animate-slide-up max-h-[75vh] flex flex-col ring-1 ring-slate-200/80 dark:ring-[#232b38]"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100 dark:border-[#232b38]">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Expiry Notifications</h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-full active:bg-slate-100 dark:active:bg-[#1c2430] text-slate-400 dark:text-slate-300">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {loading && notifications.length === 0 ? (
                <p className="text-center text-slate-400 dark:text-slate-300 py-8 text-sm">Loading...</p>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-slate-400 dark:text-slate-300">
                  <Bell size={36} className="mb-3 opacity-50" />
                  <p className="text-sm">No expiry notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n._id} className={`flex items-start gap-3 p-3 rounded-2xl transition-colors border ${n.read ? 'bg-white/80 dark:bg-[#0f141c] border-slate-200/80 dark:border-[#232b38]' : 'bg-indigo-50/90 dark:bg-[#171d27] border-indigo-100 dark:border-[#2d3550]'}`}>
                      <div className="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-[#232b38] flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar size={16} className="text-[#4f46e5]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-100 truncate">{n.documentId?.documentName || 'Unknown document'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">Expires {formatDate(n.documentId?.expiryDate)}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Reminder {n.windowDays} day(s) before &middot; {timeAgo(n.notifiedAt)}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-[#4f46e5] shrink-0 mt-2" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
