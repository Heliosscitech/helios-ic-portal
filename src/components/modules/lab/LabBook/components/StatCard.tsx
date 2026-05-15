import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../../../../lib/utils';

interface StatCardProps {
  label:     string;
  value:     number | string;
  icon:      LucideIcon;
  accentBar: 'teal' | 'amber' | 'blue' | 'green';
}

const BAR_CLASS: Record<StatCardProps['accentBar'], string> = {
  teal:  'before:bg-[#1F6E56]',
  amber: 'before:bg-[#BA7517]',
  blue:  'before:bg-[#378ADD]',
  green: 'before:bg-[#1F3D2E]',
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, accentBar }) => (
  <div
    className={cn(
      'relative bg-white/70 border border-[#cdc4ad] rounded-xl p-5 flex flex-col gap-2 overflow-hidden',
      "before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5",
      BAR_CLASS[accentBar]
    )}
  >
    <div className="flex items-center justify-between pl-2">
      <span className="text-[11px] font-semibold tracking-[1px] uppercase text-[#6f6749]">{label}</span>
      <Icon size={18} className="text-[#8b8266]" strokeWidth={1.5} />
    </div>
    <div className="helios-eln-title text-[36px] font-bold leading-none pl-2">{value}</div>
  </div>
);
