export type NotificationSource = 'board' | 'takvim' | 'lab-checklist' | 'leave' | 'onboarding' | 'kartvizit' | 'satin-alma';

export type NotificationType =
  | 'task-created'
  | 'task-assigned'
  | 'task-status-changed'
  | 'task-updated'
  | 'task-deleted'
  | 'event-created'
  | 'event-deleted'
  | 'lab-problem-reported'
  | 'leave-requested'
  | 'leave-approved'
  | 'leave-rejected'
  | 'onboarding-person-added'
  | 'contact-created'
  | 'purchase-assigned'
  | 'purchase-status-changed';

export interface Notification {
  id: string;
  type: NotificationType;
  source: NotificationSource;
  entityId: string;
  entityTitle: string;
  actorId: string;
  targetUserIds: string[];
  message: string;
  timestamp: number;
  readBy: string[];
}

export const formatRelativeTime = (timestamp: number, now: number = Date.now()): string => {
  const diff = Math.max(0, now - timestamp);
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;

  if (diff < min) return 'az önce';
  if (diff < hour) return `${Math.floor(diff / min)} dk önce`;
  if (diff < day) return `${Math.floor(diff / hour)} saat önce`;
  if (diff < 2 * day) return 'dün';
  if (diff < 7 * day) return `${Math.floor(diff / day)} gün önce`;
  return new Date(timestamp).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  });
};
