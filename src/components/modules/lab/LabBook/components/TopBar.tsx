import React from 'react';
import { Search, FileDown } from 'lucide-react';

interface TopBarProps {
  query:      string;
  onQuery:    (v: string) => void;
  onExport:   () => void;
  exporting:  boolean;
  showSearch: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ query, onQuery, onExport, exporting, showSearch }) => (
  <div className="flex items-center gap-6 px-8 py-5 border-b border-[#cdc4ad]">
    {/* Logo & subtitle */}
    <div className="flex items-baseline gap-4">
      <h1 className="helios-eln-title text-[32px] font-bold leading-none">Helios ELN</h1>
      <span className="text-[10.5px] tracking-[2px] uppercase text-[#6f6749] font-semibold">
        Lab Notebook · Helios Bilim ve Teknoloji
      </span>
    </div>

    <div className="flex-1" />

    {/* Search */}
    {showSearch && (
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8266]" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Ara..."
          className="w-64 pl-9 pr-3 py-2 text-[13px] bg-white/70 border border-[#cdc4ad] rounded-lg outline-none focus:border-[#1F3D2E] focus:ring-2 focus:ring-[#1F3D2E]/15 placeholder:text-[#9b9275]"
        />
      </div>
    )}

    {/* Backup / Export */}
    <button
      type="button"
      onClick={onExport}
      disabled={exporting}
      className="flex items-center gap-2 px-4 py-2 text-[12.5px] font-semibold uppercase tracking-[1px] text-[#1F3D2E] bg-white border border-[#cdc4ad] rounded-lg hover:bg-[#ece4cf] transition-colors disabled:opacity-60"
    >
      <FileDown size={14} strokeWidth={2} />
      {exporting ? 'Hazırlanıyor…' : 'Yedek'}
    </button>
  </div>
);
