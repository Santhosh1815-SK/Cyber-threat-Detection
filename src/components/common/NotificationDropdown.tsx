import React, { useEffect, useState } from 'react';
import { Bell, Check, ExternalLink, ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { NotificationItem } from '../../types';
import { api } from '../../lib/api';
import { formatTimeAgo } from '../../lib/utils';
import { SeverityBadge } from './SeverityBadge';

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl z-50 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold text-white">Security Alerts & Signals</span>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-slate-500">Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">No active notifications</div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`p-3.5 transition-colors hover:bg-slate-800/40 ${!n.read ? 'bg-slate-850/40' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={n.severity} showDot={false} />
                  <span className="text-xs font-semibold text-slate-200">{n.title}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                  {formatTimeAgo(n.timestamp)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 line-clamp-2">{n.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
