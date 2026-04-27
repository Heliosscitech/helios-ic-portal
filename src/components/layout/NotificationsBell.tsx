import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  UserPlus,
  PencilLine,
  ArrowRightCircle,
  PlusCircle,
  Trash,
  CalendarPlus,
  CalendarX,
  AlertTriangle,
  CalendarClock,
  BookUser,
  Check,
  XCircle,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNotifications } from '../../lib/notifications';
import { useActiveEntity } from '../../lib/active-entity';
import { PORTAL_USERS } from '../../types/users';
import { formatRelativeTime } from '../../types/notifications';
import type { Notification, NotificationSource, NotificationType } from '../../types/notifications';

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  'task-created': <PlusCircle size={10} />,
  'task-assigned': <UserPlus size={10} />,
  'task-status-changed': <ArrowRightCircle size={10} />,
  'task-updated': <PencilLine size={10} />,
  'task-deleted': <Trash size={10} />,
  'event-created': <CalendarPlus size={10} />,
  'event-deleted': <CalendarX size={10} />,
  'lab-problem-reported': <AlertTriangle size={10} />,
  'leave-requested': <CalendarClock size={10} />,
  'leave-approved': <Check size={10} />,
  'leave-rejected': <XCircle size={10} />,
  'onboarding-person-added': <UserPlus size={10} />,
  'contact-created': <BookUser size={10} />,
  'purchase-assigned': <ShoppingCart size={10} />,
  'purchase-status-changed': <ArrowRightCircle size={10} />,
};

const TYPE_TONE: Record<NotificationType, string> = {
  'task-created': 'bg-info-bg text-info-text',
  'task-assigned': 'bg-amber-bg text-amber-text',
  'task-status-changed': 'bg-teal-bg text-teal-text',
  'task-updated': 'bg-purple-bg text-purple-text',
  'task-deleted': 'bg-red-bg text-red-text',
  'event-created': 'bg-info-bg text-info-text',
  'event-deleted': 'bg-red-bg text-red-text',
  'lab-problem-reported': 'bg-red-bg text-red-text',
  'leave-requested': 'bg-amber-bg text-amber-text',
  'leave-approved': 'bg-teal-bg text-teal-text',
  'leave-rejected': 'bg-red-bg text-red-text',
  'onboarding-person-added': 'bg-teal-bg text-teal-text',
  'contact-created': 'bg-info-bg text-info-text',
  'purchase-assigned': 'bg-amber-bg text-amber-text',
  'purchase-status-changed': 'bg-teal-bg text-teal-text',
};

const ROUTABLE_SOURCES: NotificationSource[] = ['board', 'leave', 'satin-alma'];

const getActor = (id: string) => PORTAL_USERS.find((u) => u.id === id);

export const NotificationsBell: React.FC = () => {
  const { forMe, unreadCount, currentUserId, markRead, markAllRead, clearAll } =
    useNotifications();
  const { open: openActiveEntity } = useActiveEntity();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleActivate = (n: Notification) => {
    markRead(n.id);
    if (ROUTABLE_SOURCES.includes(n.source)) {
      openActiveEntity({ source: n.source as 'board' | 'leave' | 'satin-alma', entityId: n.entityId });
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          open ? 'bg-surface-2' : 'hover:bg-surface-2'
        )}
        title="Bildirimler"
      >
        <Bell size={18} className="text-text-2" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-border text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-border/40 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
            <div>
              <h4 className="text-[14px] font-bold text-text">Bildirimler</h4>
              {unreadCount > 0 && (
                <p className="text-[11px] text-text-3">{unreadCount} okunmamış</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Tümünü okundu işaretle"
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-text-3 hover:text-text hover:bg-surface-2 rounded-md transition-colors"
                >
                  <CheckCheck size={12} /> Okundu
                </button>
              )}
              {forMe.length > 0 && (
                <button
                  onClick={clearAll}
                  title="Tüm bildirimleri sil"
                  className="p-1 text-text-3 hover:text-red-text hover:bg-red-bg rounded-md transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-105 overflow-y-auto">
            {forMe.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Bell size={28} className="mx-auto text-text-3 opacity-30 mb-2" />
                <p className="text-[13px] text-text-3 font-medium">Henüz bildirim yok</p>
              </div>
            ) : (
              forMe.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  isUnread={!n.readBy.includes(currentUserId)}
                  onActivate={() => handleActivate(n)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  isUnread: boolean;
  onActivate: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification: n, isUnread, onActivate }) => {
  const actor = getActor(n.actorId);
  return (
    <button
      onClick={onActivate}
      className={cn(
        'w-full px-4 py-3 flex items-start gap-3 text-left border-b border-border/20 last:border-b-0 transition-colors',
        isUnread ? 'bg-info-bg/30 hover:bg-info-bg/50' : 'bg-white hover:bg-surface-2/40'
      )}
    >
      <div className="relative shrink-0">
        <span
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold',
            actor?.color ?? 'bg-surface-2 text-text-3'
          )}
        >
          {actor?.initials ?? '??'}
        </span>
        <span
          className={cn(
            'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white',
            TYPE_TONE[n.type]
          )}
        >
          {TYPE_ICON[n.type]}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-text-2 leading-snug">
          <span className="font-bold text-text">{actor?.name ?? 'Bilinmeyen'}</span> {n.message}
        </p>
        <span className="text-[11px] text-text-3 font-medium mt-1 inline-block">
          {formatRelativeTime(n.timestamp)}
        </span>
      </div>

      {isUnread && (
        <span className="mt-1 shrink-0 w-2 h-2 rounded-full bg-info-border" aria-hidden="true" />
      )}
    </button>
  );
};
