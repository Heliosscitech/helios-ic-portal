import { ArrowRight } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { STATUS_META, STEP_META, STEP_ORDER } from './constants';
import type { Distributor } from './types';
import type { User } from '../../../../types/portal';

interface Props {
  distributor: Distributor;
  owner: User | undefined;
  onClick: () => void;
}

export const DistributorCard: React.FC<Props> = ({ distributor: d, owner, onClick }) => {
  const statusMeta = STATUS_META[d.status];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left bg-surface border-[0.5px] border-border rounded-2xl p-5 transition-all hover:border-text/20 hover:shadow-md hover:-translate-y-0.5 flex flex-col gap-3"
    >
      {/* Top row: country pill + status pill */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-info-bg text-info-text">
          {d.country}
        </span>
        <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded', statusMeta.pill)}>
          {statusMeta.label}
        </span>
      </div>

      {/* Body: name + expertise */}
      <div className="flex-1">
        <h4 className="text-[15px] font-bold text-text leading-tight">{d.name}</h4>
        {d.expertise && (
          <p className="text-[12px] text-text-3 mt-1">{d.expertise}</p>
        )}
      </div>

      {/* Step strip */}
      <div className="flex items-center gap-1">
        {STEP_ORDER.map((stepId) => {
          const Icon = STEP_META[stepId].icon;
          const done = d.steps[stepId];
          return (
            <div
              key={stepId}
              title={STEP_META[stepId].label}
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-md border transition-colors',
                done
                  ? 'bg-teal-bg border-teal-text/30 text-teal-text'
                  : 'bg-surface-2/40 border-border text-text-3/60'
              )}
            >
              <Icon size={12} />
            </div>
          );
        })}
      </div>

      {/* Footer: owner + next step */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border text-[12px]">
        {owner ? (
          <div className="flex items-center gap-1.5 text-text-2 font-medium min-w-0">
            <div className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0',
              owner.color
            )}>
              {owner.initials}
            </div>
            <span className="truncate">{owner.name.split(' ')[0]}</span>
          </div>
        ) : (
          <span className="text-text-3 font-medium">Sorumlu yok</span>
        )}

        {d.nextStep && (
          <div className="flex items-center gap-1 text-text-3 min-w-0 flex-1 justify-end">
            <ArrowRight size={12} className="shrink-0" />
            <span className="truncate">{d.nextStep}</span>
          </div>
        )}
      </div>
    </button>
  );
};
