import React from 'react';
import { Home, FlaskConical, Layers, BookOpen, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { LAB_TABS, type LabTabId } from '../types';

const ICONS: Record<string, LucideIcon> = {
  home:   Home,
  flask:  FlaskConical,
  layers: Layers,
  book:   BookOpen,
  cap:    GraduationCap,
};

interface TabNavProps {
  active: LabTabId;
  onChange: (id: LabTabId) => void;
}

export const TabNav: React.FC<TabNavProps> = ({ active, onChange }) => (
  <nav className="flex items-stretch border-b border-[#cdc4ad] bg-[#f5efe0]/40">
    {LAB_TABS.map((tab) => {
      const Icon = ICONS[tab.icon] ?? Home;
      const isActive = active === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-5 py-3 text-[12.5px] font-semibold uppercase tracking-[1.2px] transition-colors',
            isActive
              ? 'helios-eln-tab-active'
              : 'text-[#5a5240] hover:bg-[#ece4cf]/70'
          )}
        >
          <Icon size={15} strokeWidth={isActive ? 2 : 1.7} />
          {tab.label}
        </button>
      );
    })}
  </nav>
);
