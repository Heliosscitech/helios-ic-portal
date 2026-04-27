import { ExternalLink, Trash2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { ANALYSIS_META, STATUS_META, STATUS_ORDER } from './constants';
import { cycleAnalysis, formatDayRange } from './utils';
import type { AnalysisState, Experiment, ExperimentStatus } from './types';
import type { User } from '../../../../types/portal';

interface Props {
  experiment: Experiment;
  devices: string[];
  owner: User | undefined;
  onUpdate: (id: string, patch: Partial<Experiment>) => void;
  onAddDevice: (name: string) => void;
  onDelete: (id: string) => void;
  onOpenEdit: (id: string) => void;
}

type AnalysisKey = 'bet' | 'xrd' | 'sem';

const cellCls = 'px-3 py-3 align-middle text-[12.5px] text-text-2';

export const ExperimentRow: React.FC<Props> = ({
  experiment: e,
  devices,
  owner,
  onUpdate,
  onAddDevice,
  onDelete,
  onOpenEdit,
}) => {
  const handleDevice = (value: string) => {
    if (value === '__new__') {
      const next = window.prompt('Yeni cihaz adı:');
      if (next?.trim()) {
        onAddDevice(next.trim());
        onUpdate(e.id, { device: next.trim() });
      }
      return;
    }
    onUpdate(e.id, { device: value });
  };

  const handleAnalysis = (key: AnalysisKey) => {
    onUpdate(e.id, { [key]: cycleAnalysis(e[key]) } as Partial<Experiment>);
  };

  const renderAnalysis = (state: AnalysisState) => {
    if (state === '') {
      return <span className="block w-4 h-4 border border-border rounded mx-auto" />;
    }
    const meta = ANALYSIS_META[state];
    return (
      <span className={cn('inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold', meta.pill)}>
        {state === 'done' ? '✓' : meta.label}
      </span>
    );
  };

  return (
    <tr className="border-t border-border/40 hover:bg-surface-2/30 transition-colors">
      <td className={cn(cellCls, 'text-text-3 whitespace-nowrap')}>
        {formatDayRange(e.startDate, e.endDate)}
      </td>
      <td className={cn(cellCls, 'font-mono text-[11.5px] text-text-2 whitespace-nowrap')}>
        {e.code || '—'}
      </td>
      <td
        className={cn(cellCls, 'text-text font-medium cursor-pointer min-w-56')}
        onClick={() => onOpenEdit(e.id)}
      >
        {e.name || <span className="text-text-3 italic">İsimsiz deney</span>}
      </td>
      <td className={cellCls}>
        {e.mof && (
          <span className="inline-block px-2 py-0.5 rounded bg-purple-bg text-purple-text text-[11px] font-semibold whitespace-nowrap">
            {e.mof}
          </span>
        )}
      </td>
      <td className={cn(cellCls, 'text-text-3 text-[12px] min-w-64 max-w-80')}>
        {e.purpose}
      </td>
      <td className={cellCls}>
        {e.synthesisAmount && (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-text-2 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-info-border" />
            {e.synthesisAmount}
          </span>
        )}
      </td>
      <td className={cellCls}>
        {e.workupAmount && (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-text-2 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-text" />
            {e.workupAmount}
          </span>
        )}
      </td>
      <td className={cellCls}>
        <select
          value={e.device}
          onChange={(ev) => handleDevice(ev.target.value)}
          className="bg-white border border-border rounded px-2 py-1 text-[12px] outline-none focus:border-text"
        >
          {devices.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
          {!devices.includes(e.device) && e.device && (
            <option value={e.device}>{e.device}</option>
          )}
          <option value="__new__">+ Yeni cihaz...</option>
        </select>
      </td>
      <td className={cn(cellCls, 'text-center')}>
        <button type="button" onClick={() => handleAnalysis('bet')} className="cursor-pointer">
          {renderAnalysis(e.bet)}
        </button>
      </td>
      <td className={cn(cellCls, 'text-center')}>
        <button type="button" onClick={() => handleAnalysis('xrd')} className="cursor-pointer">
          {renderAnalysis(e.xrd)}
        </button>
      </td>
      <td className={cn(cellCls, 'text-center')}>
        <button type="button" onClick={() => handleAnalysis('sem')} className="cursor-pointer">
          {renderAnalysis(e.sem)}
        </button>
      </td>
      <td className={cellCls}>
        {owner ? (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <div className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0',
              owner.color
            )}>
              {owner.initials}
            </div>
            <span className="text-[12px] text-text-2">{owner.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span className="text-[12px] text-text-3">—</span>
        )}
      </td>
      <td className={cellCls}>
        {e.elnLink ? (
          <a
            href={e.elnLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(ev) => ev.stopPropagation()}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-info-bg text-info-text text-[11px] font-semibold hover:underline"
          >
            <ExternalLink size={10} /> ELN
          </a>
        ) : (
          <span className="text-[12px] text-text-3">—</span>
        )}
      </td>
      <td className={cellCls}>
        <div className={cn('relative inline-block rounded-md', STATUS_META[e.status].pill)}>
          <select
            value={e.status}
            onChange={(ev) => onUpdate(e.id, { status: ev.target.value as ExperimentStatus })}
            className={cn(
              'appearance-none bg-transparent pl-2.5 pr-6 py-1 text-[11px] font-semibold rounded-md outline-none cursor-pointer',
              STATUS_META[e.status].pill
            )}
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px]">▾</span>
        </div>
      </td>
      <td className={cn(cellCls, 'text-right')}>
        <button
          type="button"
          onClick={() => onDelete(e.id)}
          className="p-1.5 text-text-3/60 hover:text-red-text hover:bg-red-bg/40 rounded-md transition-colors"
          aria-label="Sil"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
};
