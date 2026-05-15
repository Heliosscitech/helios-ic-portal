import React from 'react';
import {
  ChevronRight, ChevronDown, Plus, Pencil, Trash2,
  FlaskConical, RotateCw, Scale, SlidersHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { getCachedUsers } from '../../../../../lib/users';
import { SUB_TYPE_LABEL, formatDateShort } from '../types';
import type { Experiment, SubExperimentType } from '../types';

const SUB_ICONS: Record<SubExperimentType, LucideIcon> = {
  repeat:    RotateCw,
  scale_up:  Scale,
  parameter: SlidersHorizontal,
};

interface Props {
  experiment:       Experiment;
  depth:            number;
  allExperiments:   Experiment[];
  expanded:         Set<string>;
  toggleExpand:     (id: string) => void;
  selectedId:       string | null;
  onSelect:         (id: string) => void;
  onAddChild:       (parent: Experiment) => void;
  onEdit:           (exp: Experiment) => void;
  onDelete:         (exp: Experiment) => void;
  /** Toplu seçim modu — checkbox göster, click → toggle */
  selectMode?:      boolean;
  selectedIds?:     Set<string>;
  onToggleSelect?:  (id: string) => void;
}

export const ExperimentTreeNode: React.FC<Props> = ({
  experiment, depth, allExperiments, expanded, toggleExpand,
  selectedId, onSelect, onAddChild, onEdit, onDelete,
  selectMode, selectedIds, onToggleSelect,
}) => {
  const isExpanded = expanded.has(experiment.id);
  const isSelected = selectedId === experiment.id;
  const isChecked = selectedIds?.has(experiment.id) ?? false;
  const Icon = experiment.subType ? SUB_ICONS[experiment.subType] : FlaskConical;
  const users = getCachedUsers();
  const authorName = experiment.authorId
    ? users.find((u) => u.id === experiment.authorId)?.name ?? experiment.authorId
    : '—';

  // Doğrudan alt deneyler — sub_type'a göre grupla
  const children = allExperiments.filter((e) => e.parentId === experiment.id);
  const groupedChildren: Record<SubExperimentType, Experiment[]> = {
    repeat: [], scale_up: [], parameter: [],
  };
  children.forEach((c) => {
    if (c.subType) groupedChildren[c.subType].push(c);
  });

  return (
    <div>
      {/* Node satırı */}
      <div
        className={cn(
          'group/node flex items-center gap-1.5 py-1.5 cursor-pointer transition-colors',
          selectMode
            ? (isChecked ? 'bg-[#f5efe0]' : 'hover:bg-[#f5efe0]/60')
            : (isSelected ? 'bg-[#1F3D2E] text-white' : 'hover:bg-[#f5efe0]'),
        )}
        style={{ paddingLeft: `${depth * 14 + 12}px`, paddingRight: '8px' }}
        onClick={() => {
          if (selectMode) onToggleSelect?.(experiment.id);
          else onSelect(experiment.id);
        }}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleExpand(experiment.id); }}
          className={cn('shrink-0', isSelected && !selectMode ? 'text-white/80' : 'text-[#6f6749]')}
        >
          {children.length > 0
            ? (isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />)
            : <span className="inline-block w-2.75" />}
        </button>
        {selectMode && (
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => onToggleSelect?.(experiment.id)}
            onClick={(e) => e.stopPropagation()}
            className="w-3.5 h-3.5 shrink-0 accent-[#BA7517] cursor-pointer"
          />
        )}
        <Icon
          size={12}
          strokeWidth={1.8}
          className={cn('shrink-0', isSelected && !selectMode ? 'text-white' : 'text-[#6f6749]')}
        />
        <div className="flex-1 min-w-0">
          <div className={cn('text-[12.5px] font-semibold truncate', isSelected && !selectMode ? 'text-white' : 'text-[#1F3D2E]')}>
            {experiment.title}
          </div>
          <div className={cn('text-[10px] font-mono truncate', isSelected && !selectMode ? 'text-white/70' : 'text-[#6f6749]')}>
            {authorName} · {formatDateShort(experiment.experimentDate)}
          </div>
        </div>
        {children.length > 0 && (
          <span className={cn('text-[10px] font-mono shrink-0', isSelected && !selectMode ? 'text-white/80' : 'text-[#6f6749]')}>
            [{children.length}]
          </span>
        )}
        <div
          className={cn(
            'flex items-center gap-0.5 transition-opacity shrink-0',
            selectMode ? 'opacity-0 pointer-events-none' :
              (isSelected ? 'opacity-100' : 'opacity-0 group-hover/node:opacity-100')
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onAddChild(experiment)}
            title="Alt deney ekle"
            className={cn('p-0.5 rounded', (isSelected && !selectMode) ? 'text-white hover:bg-white/15' : 'text-[#1F3D2E] hover:bg-white')}
          >
            <Plus size={10} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(experiment)}
            title="Düzenle"
            className={cn('p-0.5 rounded', (isSelected && !selectMode) ? 'text-white hover:bg-white/15' : 'text-[#6f6749] hover:bg-white')}
          >
            <Pencil size={10} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(experiment)}
            title="Sil"
            className={cn('p-0.5 rounded', (isSelected && !selectMode) ? 'text-white hover:bg-white/15' : 'text-[#791F1F] hover:bg-white')}
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>

      {/* Alt deneyler — sub_type'a göre grupla */}
      {isExpanded && children.length > 0 && (
        <div className="relative">
          {(['repeat','scale_up','parameter'] as SubExperimentType[]).map((t) => {
            const items = groupedChildren[t];
            if (items.length === 0) return null;
            const TypeIcon = SUB_ICONS[t];
            return (
              <div key={t}>
                <div
                  className="flex items-center gap-1.5 py-1 text-[9.5px] font-semibold tracking-[1.2px] uppercase text-[#6f6749]"
                  style={{ paddingLeft: `${(depth + 1) * 14 + 12}px` }}
                >
                  <TypeIcon size={10} className="text-[#6f6749]" />
                  {SUB_TYPE_LABEL[t]}
                </div>
                {items.map((child) => (
                  <ExperimentTreeNode
                    key={child.id}
                    experiment={child}
                    depth={depth + 2}
                    allExperiments={allExperiments}
                    expanded={expanded}
                    toggleExpand={toggleExpand}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onAddChild={onAddChild}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    selectMode={selectMode}
                    selectedIds={selectedIds}
                    onToggleSelect={onToggleSelect}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
