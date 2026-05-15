import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon:     LucideIcon;
  title:    string;
  subtitle: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, subtitle }) => (
  <div className="border-2 border-dashed border-[#cdc4ad] rounded-2xl flex-1 flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
    <Icon size={36} strokeWidth={1.4} className="text-[#8b8266]" />
    <h3 className="helios-eln-title text-[20px] font-bold mt-1">{title}</h3>
    <p className="text-[13px] italic text-[#6f6749]">{subtitle}</p>
  </div>
);
