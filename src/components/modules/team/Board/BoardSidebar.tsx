import React from 'react';
import { LayoutGrid, List, BarChart3, Inbox, FolderOpen, Plus } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { PORTAL_USERS } from '../../../../types/users';
import { UNITS } from './types';
import type { ViewMode, BoardFilter, UnitId, FilterScope } from './types';

interface BoardSidebarProps {
  view: ViewMode;
  filter: BoardFilter;
  counts: {
    total: number;
    assignedToMe: number;
    createdByMe: number;
    byUnit: Record<UnitId, number>;
    byMember: Record<string, number>;
    teamSize: number;
  };
  onViewChange: (v: ViewMode) => void;
  onScopeChange: (s: FilterScope) => void;
  onUnitChange: (u: UnitId | 'all') => void;
  onMemberChange: (id: string | null) => void;
}

const SECTION_TITLE = 'text-[11px] font-semibold uppercase tracking-widest text-text-3 px-3 mb-2';
const ITEM_BASE =
  'w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors group';
const ITEM_IDLE = 'text-text-2 hover:bg-surface-2/60';
const ITEM_ACTIVE = 'bg-amber-bg text-amber-text font-semibold';

export const BoardSidebar: React.FC<BoardSidebarProps> = ({
  view,
  filter,
  counts,
  onViewChange,
  onScopeChange,
  onUnitChange,
  onMemberChange,
}) => {
  const isUnitAll = filter.unitId === 'all' && filter.scope === 'all' && !filter.memberId;

  return (
    <aside className="w-[260px] shrink-0 bg-surface-2/40 border-r border-border/40 p-4 overflow-y-auto">
      {/* GÖRÜNÜMLER */}
      <section className="mb-6">
        <h4 className={SECTION_TITLE}>Görünümler</h4>
        <div className="space-y-0.5">
          <button
            onClick={() => onViewChange('board')}
            className={cn(ITEM_BASE, view === 'board' ? ITEM_ACTIVE : ITEM_IDLE)}
          >
            <LayoutGrid size={14} className="shrink-0" />
            <span className="flex-1 text-left">Board</span>
            <span className="text-[11px] text-text-3 font-medium tabular-nums">{counts.total}</span>
          </button>
          <button
            onClick={() => onViewChange('list')}
            className={cn(ITEM_BASE, view === 'list' ? ITEM_ACTIVE : ITEM_IDLE)}
          >
            <List size={14} className="shrink-0" />
            <span className="flex-1 text-left">Liste</span>
            <span className="text-[11px] text-text-3 font-medium tabular-nums">{counts.total}</span>
          </button>
          <button
            onClick={() => onViewChange('dashboard')}
            className={cn(ITEM_BASE, view === 'dashboard' ? ITEM_ACTIVE : ITEM_IDLE)}
          >
            <BarChart3 size={14} className="shrink-0" />
            <span className="flex-1 text-left">Dashboard</span>
          </button>
        </div>
      </section>

      {/* BANA ÖZEL */}
      <section className="mb-6">
        <h4 className={SECTION_TITLE}>Bana Özel</h4>
        <div className="space-y-0.5">
          <button
            onClick={() => onScopeChange(filter.scope === 'assigned-to-me' ? 'all' : 'assigned-to-me')}
            className={cn(ITEM_BASE, filter.scope === 'assigned-to-me' ? ITEM_ACTIVE : ITEM_IDLE)}
          >
            <Inbox size={14} className="shrink-0" />
            <span className="flex-1 text-left">Bana atananlar</span>
            <span className="text-[11px] text-text-3 font-medium tabular-nums">{counts.assignedToMe}</span>
          </button>
          <button
            onClick={() => onScopeChange(filter.scope === 'created-by-me' ? 'all' : 'created-by-me')}
            className={cn(ITEM_BASE, filter.scope === 'created-by-me' ? ITEM_ACTIVE : ITEM_IDLE)}
          >
            <FolderOpen size={14} className="shrink-0" />
            <span className="flex-1 text-left">Atadıklarım</span>
            <span className="text-[11px] text-text-3 font-medium tabular-nums">{counts.createdByMe}</span>
          </button>
        </div>
      </section>

      {/* BİRİMLER */}
      <section className="mb-6">
        <h4 className={SECTION_TITLE}>Birimler</h4>
        <div className="space-y-0.5">
          <button
            onClick={() => onUnitChange('all')}
            className={cn(ITEM_BASE, isUnitAll ? ITEM_ACTIVE : ITEM_IDLE)}
          >
            <span className="w-2 h-2 rounded-full bg-text-3 shrink-0" />
            <span className="flex-1 text-left">Tüm birimler</span>
            <span className="text-[11px] text-text-3 font-medium tabular-nums">{counts.total}</span>
          </button>
          {UNITS.map((u) => (
            <button
              key={u.id}
              onClick={() => onUnitChange(filter.unitId === u.id ? 'all' : u.id)}
              className={cn(ITEM_BASE, filter.unitId === u.id ? ITEM_ACTIVE : ITEM_IDLE)}
            >
              <span className={cn('w-2 h-2 rounded-full shrink-0', u.dotColor)} />
              <span className="flex-1 text-left">{u.label}</span>
              <span className="text-[11px] text-text-3 font-medium tabular-nums">{counts.byUnit[u.id]}</span>
            </button>
          ))}
          <button className={cn(ITEM_BASE, 'text-text-3 italic hover:bg-surface-2/60')}>
            <Plus size={12} className="shrink-0 opacity-60" />
            <span className="flex-1 text-left text-[12.5px]">Birim ekle / düzenle</span>
          </button>
        </div>
      </section>

      {/* EKİP */}
      <section>
        <h4 className={SECTION_TITLE}>Ekip ({counts.teamSize})</h4>
        <div className="space-y-0.5">
          {PORTAL_USERS.slice(0, 6).map((u) => (
            <button
              key={u.id}
              onClick={() => onMemberChange(filter.memberId === u.id ? null : u.id)}
              className={cn(ITEM_BASE, filter.memberId === u.id ? ITEM_ACTIVE : ITEM_IDLE)}
            >
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-semibold shrink-0',
                  u.color
                )}
              >
                {u.initials}
              </span>
              <span className="flex-1 text-left truncate">{u.name}</span>
              <span className="text-[11px] text-text-3 font-medium tabular-nums">
                {counts.byMember[u.id] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
};
