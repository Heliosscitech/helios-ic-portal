import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { PORTAL_USERS } from '../../../../../types/users';
import { UNITS } from '../types';
import type { BoardTask, TaskStatus } from '../types';

interface DashboardViewProps {
  tasks: BoardTask[];
}

const STATUS_META: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
  todo: { label: 'Yapılacak', color: 'bg-gray-400', icon: <Clock size={14} /> },
  doing: { label: 'Devam', color: 'bg-amber-500', icon: <AlertTriangle size={14} /> },
  done: { label: 'Tamamlandı', color: 'bg-teal-500', icon: <CheckCircle2 size={14} /> },
};

export const DashboardView: React.FC<DashboardViewProps> = ({ tasks }) => {
  const total = tasks.length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const doingCount = tasks.filter((t) => t.status === 'doing').length;
  const todoCount = tasks.filter((t) => t.status === 'todo').length;
  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const unitCounts = UNITS.map((u) => ({
    ...u,
    count: tasks.filter((t) => t.unitId === u.id).length,
  }));
  const maxUnitCount = Math.max(...unitCounts.map((u) => u.count), 1);

  const memberCounts = PORTAL_USERS.slice(0, 6).map((m) => ({
    ...m,
    count: tasks.filter((t) => t.assigneeIds.includes(m.id)).length,
  }));
  const maxMemberCount = Math.max(...memberCounts.map((m) => m.count), 1);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Üst istatistik kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Toplam İş" value={total} tone="text-text" />
        <StatCard label="Yapılacak" value={todoCount} tone="text-text-2" dot="bg-gray-400" />
        <StatCard label="Devam" value={doingCount} tone="text-amber-text" dot="bg-amber-500" />
        <StatCard label="Tamamlandı" value={doneCount} tone="text-teal-text" dot="bg-teal-500" />
      </div>

      {/* Tamamlanma oranı */}
      <div className="bg-white border border-border/40 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-widest text-text-3">
              Tamamlanma Oranı
            </h3>
            <p className="text-[32px] font-black text-text mt-1">%{completionRate}</p>
          </div>
          <div className="flex items-center gap-2 text-teal-text bg-teal-bg px-3 py-1.5 rounded-lg text-[12px] font-bold">
            <TrendingUp size={14} />
            {doneCount}/{total} iş
          </div>
        </div>
        <div className="h-3 bg-surface-2 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-teal-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Birim dağılımı */}
        <div className="bg-white border border-border/40 rounded-xl p-6 shadow-sm">
          <h3 className="text-[13px] font-bold uppercase tracking-widest text-text-3 mb-5">
            Birim Dağılımı
          </h3>
          <div className="space-y-4">
            {unitCounts.map((u) => (
              <div key={u.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', u.dotColor)} />
                    <span className="font-semibold text-text-2">{u.label}</span>
                  </div>
                  <span className="font-mono font-bold text-text">{u.count}</span>
                </div>
                <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(u.count / maxUnitCount) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={cn('h-full', u.dotColor)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ekip dağılımı */}
        <div className="bg-white border border-border/40 rounded-xl p-6 shadow-sm">
          <h3 className="text-[13px] font-bold uppercase tracking-widest text-text-3 mb-5">
            Ekip Yükü
          </h3>
          <div className="space-y-4">
            {memberCounts.map((m) => (
              <div key={m.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold',
                        m.color
                      )}
                    >
                      {m.initials}
                    </span>
                    <span className="font-semibold text-text-2">{m.name}</span>
                  </div>
                  <span className="font-mono font-bold text-text">{m.count}</span>
                </div>
                <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(m.count / maxMemberCount) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-[#010D52]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Durum dağılımı */}
      <div className="bg-white border border-border/40 rounded-xl p-6 shadow-sm">
        <h3 className="text-[13px] font-bold uppercase tracking-widest text-text-3 mb-5">
          Durum Dağılımı
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(STATUS_META) as TaskStatus[]).map((s) => {
            const count = tasks.filter((t) => t.status === s).length;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const meta = STATUS_META[s];
            return (
              <div key={s} className="p-4 bg-surface-2/40 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[12px] font-bold text-text-2">
                    {meta.icon}
                    {meta.label}
                  </div>
                  <span className="text-[11px] font-bold text-text-3">%{pct}</span>
                </div>
                <p className="text-[24px] font-black text-text">{count}</p>
                <div className="h-1.5 bg-white mt-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5 }}
                    className={cn('h-full', meta.color)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number;
  tone: string;
  dot?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, tone, dot }) => (
  <div className="bg-white border border-border/40 rounded-xl p-5 shadow-sm">
    <div className="flex items-center gap-2 mb-2">
      {dot && <span className={cn('w-2 h-2 rounded-full', dot)} />}
      <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-3">{label}</h4>
    </div>
    <p className={cn('text-[28px] font-black leading-none', tone)}>{value}</p>
  </div>
);
