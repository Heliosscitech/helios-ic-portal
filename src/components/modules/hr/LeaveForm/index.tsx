import React, { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { PORTAL_USERS } from '../../../../types/users';
import type { ModuleProps } from '../../../../types/portal';
import { usePersistentState } from '../../../../lib/persistence';
import { useNotifications } from '../../../../lib/notifications';
import { StepPerson } from './steps/StepPerson';
import { StepDateReason } from './steps/StepDateReason';
import { StepSummary } from './steps/StepSummary';
import { REASONS } from './types';
import type { LeaveFormState, LeaveRequest } from './types';

const REQUESTS_KEY = 'helios:leave-requests';

const buildInitialForm = (employeeId: string, employeeName: string): LeaveFormState => ({
  employeeId,
  departman: 'İş Geliştirme',
  managerId: '',
  email: employeeName.split(' ')[0]?.toLowerCase() ?? '',
  rangeStart: 0,
  rangeEnd: 0,
  reason: 'saglik',
  reasonDetail: '',
  belge: 'Sonradan getireceğim',
  telafiNotu: '',
  telafiGunleri: [],
});

export const LeaveForm: React.FC<ModuleProps> = ({ user }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<LeaveFormState>(() => buildInitialForm(user.id, user.name));
  const [justSubmittedId, setJustSubmittedId] = useState<string | null>(null);
  const [requests, setRequests] = usePersistentState<LeaveRequest[]>(REQUESTS_KEY, []);

  const { dispatch } = useNotifications();

  const myRequests = requests.filter((r) => r.employeeId === user.id);
  const assignedToMe = requests.filter((r) => r.managerId === user.id);

  const handleToggleRange = (day: number) => {
    setForm((prev) => {
      if (!prev.rangeStart || (prev.rangeStart && prev.rangeEnd)) {
        return { ...prev, rangeStart: day, rangeEnd: 0 };
      }
      const start = Math.min(prev.rangeStart, day);
      const end = Math.max(prev.rangeStart, day);
      return { ...prev, rangeStart: start, rangeEnd: end };
    });
  };

  const handleToggleTelafi = (day: number) => {
    setForm((prev) => ({
      ...prev,
      telafiGunleri: prev.telafiGunleri.includes(day)
        ? prev.telafiGunleri.filter((d) => d !== day)
        : [...prev.telafiGunleri, day],
    }));
  };

  const canGoNext =
    step === 1 ? form.managerId !== '' && form.departman && form.email :
    step === 2 ? form.rangeStart > 0 && form.reason :
    true;

  const handleSubmit = () => {
    const id = `LR-${Date.now().toString(36).toUpperCase()}`;
    const req: LeaveRequest = {
      id,
      employeeId: user.id,
      departman: form.departman,
      managerId: form.managerId,
      email: form.email,
      rangeStart: form.rangeStart,
      rangeEnd: form.rangeEnd,
      reason: form.reason,
      reasonDetail: form.reasonDetail,
      belge: form.belge,
      belgeFileName: form.belgeFileName,
      belgeFileDataUrl: form.belgeFileDataUrl,
      telafiNotu: form.telafiNotu,
      telafiGunleri: form.telafiGunleri,
      submittedAt: Date.now(),
      status: 'pending',
    };

    const rangeLabel = req.rangeEnd
      ? `${req.rangeStart}–${req.rangeEnd} Nisan 2026`
      : `${req.rangeStart} Nisan 2026`;

    if (form.managerId && form.managerId !== user.id) {
      dispatch({
        type: 'leave-requested',
        source: 'leave',
        entityId: id,
        entityTitle: `${user.name} — ${rangeLabel}`,
        actorId: user.id,
        targetUserIds: [form.managerId],
        message: `izin talebi gönderdi: ${rangeLabel} (${
          REASONS.find((r) => r.id === form.reason)?.label ?? 'neden'
        })`,
      });
    }

    setRequests((prev) => [req, ...prev]);
    setJustSubmittedId(id);
  };

  const handleNewRequest = () => {
    setJustSubmittedId(null);
    setForm(buildInitialForm(user.id, user.name));
    setStep(1);
  };

  if (justSubmittedId) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-6 animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto">
          <Check size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-[17px] font-semibold text-text">Talebiniz Alındı</h2>
          <p className="text-[15px] text-text-3">
            İzin talebiniz yöneticinize iletildi. Talep durumunu aşağıdan takip edebilirsiniz.
          </p>
        </div>
        <button
          onClick={handleNewRequest}
          className="px-8 py-3 bg-[#1a1a19] text-white rounded-xl font-semibold text-[14px]"
        >
          Yeni Talep Oluştur
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
      <div className="bg-white px-6 py-3 border border-border/40 rounded-xl flex items-center gap-2 text-[13px] text-text-3 font-medium">
        <span className="hover:text-text cursor-pointer">Uygulamalar</span>
        <span>/</span>
        <span className="text-text font-semibold">İzin / mazeret</span>
      </div>

      <div className="grid grid-cols-3 gap-2 px-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={cn(
              'flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all border',
              step === n
                ? 'bg-[#1a1a19] border-[#1a1a19] text-white shadow-lg'
                : step > n
                  ? 'bg-white border-border/20 text-teal-600'
                  : 'bg-white border-border/20 text-text-3'
            )}
          >
            {step > n ? (
              <Check size={16} />
            ) : (
              <span
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10.5px]',
                  step === n ? 'bg-white/20' : 'bg-surface-2'
                )}
              >
                {n}
              </span>
            )}
            {n === 1 ? 'Kişi' : n === 2 ? 'Tarih & neden' : 'Telafi & özet'}
          </div>
        ))}
      </div>

      <div className="animate-in slide-in-from-bottom-2 duration-300">
        {step === 1 && (
          <StepPerson
            employee={user}
            departman={form.departman}
            managerId={form.managerId}
            email={form.email}
            onDepartmanChange={(v) => setForm({ ...form, departman: v })}
            onManagerChange={(v) => setForm({ ...form, managerId: v })}
            onEmailChange={(v) => setForm({ ...form, email: v })}
          />
        )}

        {step === 2 && (
          <StepDateReason
            rangeStart={form.rangeStart}
            rangeEnd={form.rangeEnd}
            reason={form.reason}
            reasonDetail={form.reasonDetail}
            belge={form.belge}
            belgeFileName={form.belgeFileName}
            belgeFileDataUrl={form.belgeFileDataUrl}
            onToggleRange={handleToggleRange}
            onClearRange={() => setForm({ ...form, rangeStart: 0, rangeEnd: 0 })}
            onReasonChange={(r) => setForm({ ...form, reason: r })}
            onReasonDetailChange={(v) => setForm({ ...form, reasonDetail: v })}
            onBelgeChange={(v) => setForm({ ...form, belge: v })}
            onBelgeFileChange={(name, dataUrl) =>
              setForm({ ...form, belgeFileName: name, belgeFileDataUrl: dataUrl })
            }
          />
        )}

        {step === 3 && (
          <StepSummary
            form={form}
            employee={user}
            onTelafiToggle={handleToggleTelafi}
            onTelafiNotuChange={(v) => setForm({ ...form, telafiNotu: v })}
          />
        )}

        <div className="flex items-center gap-4 mt-10">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="px-8 py-4 border border-border rounded-xl text-[14px] font-semibold text-text-2 hover:bg-surface-2 transition-all flex items-center gap-2"
            >
              <ChevronLeft size={18} /> Geri
            </button>
          )}
          <button
            onClick={() => {
              if (step === 3) handleSubmit();
              else if (canGoNext) setStep((s) => (s + 1) as 1 | 2 | 3);
            }}
            disabled={!canGoNext}
            className={cn(
              'flex-1 py-4 rounded-xl font-semibold text-[15px] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]',
              canGoNext ? 'bg-[#1a1a19] text-white hover:bg-black' : 'bg-surface-2 text-text-3 cursor-not-allowed'
            )}
          >
            {step === 3 ? (
              <>Gönder <Check size={20} /></>
            ) : (
              <>Devam et <ChevronRight size={20} /></>
            )}
          </button>
        </div>
      </div>

      {(myRequests.length > 0 || assignedToMe.length > 0) && (
        <div className="pt-4 space-y-6">
          {myRequests.length > 0 && (
            <RequestsList
              title="Benim Taleplerim"
              requests={myRequests}
              role="employee"
              currentUserId={user.id}
            />
          )}
          {assignedToMe.length > 0 && (
            <RequestsList
              title="Bana Yönelik Talepler (Yönetici olarak)"
              requests={assignedToMe}
              role="manager"
              currentUserId={user.id}
            />
          )}
        </div>
      )}

      <div className="text-center pt-10 opacity-40">
        <p className="text-[11px] text-text-3 font-semibold uppercase tracking-widest">
          Prototip görünüm • Veriler tarayıcıda kalıcı tutulur • © Helios Bilim ve Teknoloji A.Ş.
        </p>
      </div>
    </div>
  );
};

interface RequestsListProps {
  title: string;
  requests: LeaveRequest[];
  role: 'employee' | 'manager';
  currentUserId: string;
}

const RequestsList: React.FC<RequestsListProps> = ({ title, requests, role }) => {
  const findUser = (id: string) => PORTAL_USERS.find((u) => u.id === id);

  return (
    <div className="bg-white border border-border/40 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Inbox size={16} className="text-text-3" />
        <h3 className="text-[13px] font-semibold uppercase tracking-widest text-text-3">{title}</h3>
        <span className="text-[11px] bg-surface-2 px-2 py-0.5 rounded text-text-3 font-mono">
          {requests.length}
        </span>
      </div>

      <div className="space-y-2">
        {requests.map((r) => {
          const employee = findUser(r.employeeId);
          const manager = findUser(r.managerId);
          const other = role === 'employee' ? manager : employee;
          const rangeLabel = r.rangeEnd
            ? `${r.rangeStart}–${r.rangeEnd} Nisan`
            : `${r.rangeStart} Nisan`;
          const reasonLabel = REASONS.find((x) => x.id === r.reason)?.label ?? '—';

          return (
            <div
              key={r.id}
              className="flex items-center justify-between p-3 border border-border/30 rounded-lg hover:bg-surface-2/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-[10.5px] font-semibold shrink-0',
                    other?.color ?? 'bg-surface-2 text-text-3'
                  )}
                >
                  {other?.initials ?? '??'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-text truncate">
                    {role === 'employee' ? `→ ${manager?.name ?? '—'}` : employee?.name ?? '—'}
                  </p>
                  <p className="text-[11px] text-text-3 truncate">
                    {rangeLabel} · {reasonLabel}
                  </p>
                </div>
              </div>
              <StatusPill status={r.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatusPill: React.FC<{ status: LeaveRequest['status'] }> = ({ status }) => {
  const map: Record<LeaveRequest['status'], { label: string; cls: string }> = {
    pending: { label: 'Beklemede', cls: 'bg-amber-bg text-amber-text' },
    approved: { label: 'Onaylandı', cls: 'bg-teal-bg text-teal-text' },
    rejected: { label: 'Reddedildi', cls: 'bg-red-bg text-red-text' },
  };
  const s = map[status];
  return (
    <span className={cn('text-[10.5px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded', s.cls)}>
      {s.label}
    </span>
  );
};

export default LeaveForm;
