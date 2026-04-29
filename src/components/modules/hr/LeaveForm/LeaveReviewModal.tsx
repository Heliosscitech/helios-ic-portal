import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle, CalendarClock, User as UserIcon, FileText, Clock } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { useNotifications } from '../../../../lib/notifications';
import { PORTAL_USERS } from '../../../../types/users';
import { DEPARTMENTS, REASONS } from './types';
import type { LeaveRequest } from './types';
import { useLeaveRequests } from './hooks';
import { downloadFromBucket } from '../../../../lib/storage';

interface LeaveReviewModalProps {
  requestId: string;
  currentUserId: string;
  onClose: () => void;
}

const findUser = (id: string) => PORTAL_USERS.find((u) => u.id === id);

const formatRange = (r: LeaveRequest) =>
  r.rangeEnd ? `${r.rangeStart}–${r.rangeEnd} Nisan 2026` : `${r.rangeStart} Nisan 2026`;

const statusStyle: Record<LeaveRequest['status'], string> = {
  pending: 'bg-amber-bg text-amber-text',
  approved: 'bg-teal-bg text-teal-text',
  rejected: 'bg-red-bg text-red-text',
};
const statusLabel: Record<LeaveRequest['status'], string> = {
  pending: 'Beklemede',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
};

export const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
  requestId,
  currentUserId,
  onClose,
}) => {
  const { requests, decideRequest, refresh, loading } = useLeaveRequests();
  const { dispatch } = useNotifications();
  const [note, setNote] = useState('');
  const [didRefresh, setDidRefresh] = useState(false);

  // Modal açılınca cache'i tazele (bildirimden açılıyorsa stale olabilir)
  useEffect(() => {
    refresh().finally(() => setDidRefresh(true));
  }, [refresh]);

  const request = requests.find((r) => r.id === requestId);

  if (!request) {
    if (loading || !didRefresh) {
      return (
        <ModalShell onClose={onClose} title="Yükleniyor">
          <p className="text-[13px] text-text-3">Talep yükleniyor…</p>
        </ModalShell>
      );
    }
    return (
      <ModalShell onClose={onClose} title="Talep bulunamadı">
        <p className="text-[13px] text-text-3">
          Bu izin talebi mevcut değil veya görüntüleme yetkiniz yok.
        </p>
      </ModalShell>
    );
  }

  const employee = findUser(request.employeeId);
  const manager = findUser(request.managerId);
  const isManager = currentUserId === request.managerId;
  const canAct = isManager && request.status === 'pending';
  const reason = REASONS.find((r) => r.id === request.reason);

  const applyDecision = async (decision: 'approved' | 'rejected') => {
    const ok = await decideRequest(request.id, decision, note, currentUserId);
    if (!ok) return;
    if (request.employeeId !== currentUserId) {
      dispatch({
        type: decision === 'approved' ? 'leave-approved' : 'leave-rejected',
        source: 'leave',
        entityId: request.id,
        entityTitle: `${employee?.name ?? '—'} — ${formatRange(request)}`,
        actorId: currentUserId,
        targetUserIds: [request.employeeId],
        message:
          decision === 'approved'
            ? `izin talebini onayladı: ${formatRange(request)}`
            : `izin talebini reddetti: ${formatRange(request)}`,
      });
    }
    onClose();
  };

  const handleOpenBelge = async () => {
    if (!request.belgePath || !request.belgeFileName) return;
    const result = await downloadFromBucket(
      'leave-documents',
      request.belgePath,
      request.belgeFileName
    );
    if (!result.ok) {
      window.alert('Belge indirilemedi:\n' + (result.error ?? 'bilinmeyen hata'));
    }
  };

  return (
    <ModalShell onClose={onClose} title="İzin Talebi">
      <div className="space-y-5">
        {/* Header: employee + status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0',
                employee?.color ?? 'bg-surface-2 text-text-3'
              )}
            >
              {employee?.initials ?? '??'}
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-text truncate">{employee?.name ?? '—'}</p>
              <p className="text-[12.5px] text-text-3 truncate">
                {DEPARTMENTS.find((d) => d.id === request.departman)?.label ?? request.departman} · {request.email}
              </p>
            </div>
          </div>
          <span
            className={cn(
              'text-[10.5px] font-semibold uppercase tracking-wider px-2 py-1 rounded shrink-0',
              statusStyle[request.status]
            )}
          >
            {statusLabel[request.status]}
          </span>
        </div>

        {/* Key facts */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCard icon={<CalendarClock size={12} />} label="Tarih aralığı">
            {formatRange(request)}
          </InfoCard>
          <InfoCard icon={reason?.icon ? <reason.icon size={12} /> : null} label="Neden">
            {reason?.label ?? '—'}
          </InfoCard>
          <InfoCard icon={<UserIcon size={12} />} label="Yönetici">
            {manager?.name ?? '—'}
          </InfoCard>
          <InfoCard icon={<FileText size={12} />} label="Belge">
            {request.belge}
          </InfoCard>
        </div>

        {request.reasonDetail && (
          <Block label="Neden açıklaması">{request.reasonDetail}</Block>
        )}

        {request.belgeFileName && (
          <div>
            <span className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3">Belge</span>
            <div className="mt-1 flex items-center gap-3 px-3 py-2 border border-border/60 bg-surface-2/30 rounded-lg">
              <FileText size={16} className="text-text-3 shrink-0" />
              <span className="flex-1 min-w-0 text-[13px] font-semibold text-text truncate">
                {request.belgeFileName}
              </span>
              {request.belgePath && (
                <button
                  type="button"
                  onClick={handleOpenBelge}
                  className="text-[11px] font-semibold text-info-text hover:underline"
                >
                  İndir
                </button>
              )}
            </div>
          </div>
        )}

        {request.telafiGunleri.length > 0 && (
          <Block label="Telafi günleri">
            {request.telafiGunleri.sort((a, b) => a - b).join(', ')} Nisan
            {request.telafiNotu && <p className="mt-1 text-text-3">{request.telafiNotu}</p>}
          </Block>
        )}

        {request.status !== 'pending' && request.reviewerNote && (
          <Block label={`${manager?.name ?? 'Yönetici'} notu`}>{request.reviewerNote}</Block>
        )}

        {request.status !== 'pending' && request.reviewedAt && (
          <p className="text-[11px] text-text-3 flex items-center gap-1.5">
            <Clock size={11} />
            {new Date(request.reviewedAt).toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            tarihinde karar verildi
          </p>
        )}

        {/* Manager actions */}
        {canAct && (
          <div className="space-y-3 pt-3 border-t border-border/40">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-text-3">
                Not (opsiyonel)
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Çalışana iletilecek kısa bir not..."
                className="mt-1.5 w-full p-2.5 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors resize-none"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => applyDecision('rejected')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-border/40 text-red-text rounded-lg text-[13px] font-semibold hover:bg-red-bg transition-colors"
              >
                <XCircle size={15} /> Reddet
              </button>
              <button
                type="button"
                onClick={() => applyDecision('approved')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-600 text-white rounded-lg text-[13px] font-semibold hover:bg-teal-700 transition-colors"
              >
                <Check size={15} /> Onayla
              </button>
            </div>
          </div>
        )}

        {!canAct && isManager && request.status !== 'pending' && (
          <p className="text-[12.5px] text-text-3 pt-3 border-t border-border/40">
            Bu talep zaten {statusLabel[request.status].toLocaleLowerCase('tr-TR')}.
          </p>
        )}
      </div>
    </ModalShell>
  );
};

// ── Small UI helpers ─────────────────────────────────────────

const ModalShell: React.FC<{
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ onClose, title, children }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-lg mt-16 mb-8 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-text">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const InfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}> = ({ icon, label, children }) => (
  <div className="border border-border/40 rounded-xl p-3">
    <div className="flex items-center gap-1.5 text-text-3 mb-1">
      {icon}
      <span className="text-[10.5px] font-semibold uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-[13px] font-semibold text-text">{children}</p>
  </div>
);

const Block: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <span className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3">{label}</span>
    <p className="mt-1 text-[13px] text-text-2 whitespace-pre-wrap">{children}</p>
  </div>
);
