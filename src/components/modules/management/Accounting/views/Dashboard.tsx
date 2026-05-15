import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { formatMoney } from '../../../../../lib/currency';
import { BreadcrumbHome } from '../../../../BreadcrumbHome';
import { useMuhasebe } from '../context/MuhasebeContext';
import { PROGRAMS, PROGRAM_STYLES, PROJECT_TABS } from '../constants';
import { recAmt } from '../utils';
import { OzetTab }      from './OzetTab';
import { Harcamalar }   from './Harcamalar';
import { OnMuhasebe }   from './OnMuhasebe';
import { Raporlar }     from './Raporlar';
import { GiderForm }    from './GiderForm';
import type { ProjectTab, MuhasebeRecord } from '../types';

type Props = {
  projectId: string;
  tab: ProjectTab;
  onTabChange: (tab: ProjectTab) => void;
  onBack: () => void;
};

export const Dashboard: React.FC<Props> = ({ projectId, tab, onTabChange, onBack }) => {
  const { projects, usdRate } = useMuhasebe();
  const [editRecord, setEditRecord] = useState<MuhasebeRecord | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const project = projects.find(p => p.id === projectId);
  if (!project) return (
    <div className="max-w-7xl mx-auto p-6">
      <p className="text-[13px] text-text-3">Proje bulunamadı.</p>
    </div>
  );

  const prog       = PROGRAMS[project.program];
  const style      = PROGRAM_STYLES[project.program];
  const visibleTabs = project.isGenel
    ? PROJECT_TABS
    : PROJECT_TABS.filter(t => t.id !== 'onmuhasebe');

  const totalSpent  = project.records.reduce((s, r) => s + recAmt(r, usdRate), 0);
  const budget      = project.budget;
  const usedPct     = budget > 0 ? Math.min(100, (totalSpent / budget) * 100) : 0;
  const barColor    = usedPct >= 90 ? 'bg-red-500' : usedPct >= 70 ? 'bg-amber-400' : 'bg-teal-600';

  const openEditExpense = (r: MuhasebeRecord) => { setEditRecord(r); setEditModalOpen(true); };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-text-3">
        <BreadcrumbHome />
        <span>/</span>
        <button onClick={onBack} className="hover:text-text transition-colors">Proje Muhasebe</button>
        <span>/</span>
        <span className="font-semibold text-text truncate">{project.name}</span>
      </div>

      {/* Project header */}
      <div className="bg-white border border-border rounded-2xl shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-surface-2 hover:bg-surface-2/80 flex items-center justify-center text-text-2 transition-colors shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide', style.bg, style.text)}>
                  {prog.icon} {prog.shortName}
                </span>
                {project.no && <span className="text-[11px] text-text-3 font-mono">{project.no}</span>}
              </div>
              <h1 className="text-[17px] font-black text-text leading-tight">{project.name}</h1>
              {project.records.length > 0 && (
                <p className="text-[12px] text-text-3 mt-0.5">{project.records.length} harcama kalemi</p>
              )}
            </div>
          </div>

        </div>

        {/* Budget bar */}
        {budget > 0 && (
          <div className="mt-4 pt-4 border-t border-border/30">
            <div className="flex items-center justify-between text-[11px] font-semibold mb-1.5">
              <span className="text-text-3 uppercase tracking-wider">Bütçe Kullanımı</span>
              <span className="text-text-2 tabular-nums">
                {formatMoney(totalSpent, 'TRY')} / {formatMoney(budget, 'TRY')}
                <span className="ml-2 text-text-3">(%{usedPct.toFixed(1)})</span>
              </span>
            </div>
            <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', barColor)}
                initial={{ width: 0 }}
                animate={{ width: `${usedPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2 border border-border/40 rounded-xl p-1 w-fit flex-wrap">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id as ProjectTab)}
            className={cn(
              'px-4 py-2 rounded-lg text-[13px] font-semibold transition-all',
              tab === t.id ? 'bg-white text-text shadow-sm' : 'text-text-3 hover:text-text-2',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {tab === 'ozet'       && <OzetTab project={project} />}
          {tab === 'harcamalar' && <Harcamalar project={project} onEdit={openEditExpense} />}
          {tab === 'gider-ekle' && <GiderForm inline projectId={projectId} onClose={() => onTabChange('harcamalar')} />}
          {tab === 'onmuhasebe' && <OnMuhasebe project={project} />}
          {tab === 'raporlar'   && <Raporlar project={project} onDelete={onBack} />}
        </motion.div>
      </AnimatePresence>

      {/* Edit modal */}
      {editModalOpen && (
        <GiderForm
          projectId={projectId}
          record={editRecord}
          onClose={() => { setEditModalOpen(false); setEditRecord(null); }}
        />
      )}
    </div>
  );
};
