import React from 'react';
import { Construction } from 'lucide-react';
import { Breadcrumb } from '../BreadcrumbHome';

interface ModulePlaceholderProps {
  title: string;
  category: string;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({ title }) => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Breadcrumb title={title} />

      <div className="bg-white border border-border/40 rounded-2xl shadow-sm p-20 flex flex-col items-center justify-center text-center space-y-8 min-h-150">
        <div className="w-24 h-24 bg-surface-2 rounded-3xl flex items-center justify-center text-[#378ADD] animate-pulse">
          <Construction size={48} />
        </div>
        
        <div className="space-y-3 max-w-md">
          <h2 className="text-[24px] font-black text-text tracking-tight uppercase">Çok Yakında</h2>
          <p className="text-[15px] text-text-3 leading-relaxed">
            <span className="font-bold text-text-2">{title}</span> modülü şu an geliştirme aşamasındadır. Helios İç Portal ekibi bu özelliği en kısa sürede yayına alacaktır.
          </p>
        </div>

        <div className="flex items-center gap-4 pt-4">
           <div className="px-6 py-3 bg-surface-2 rounded-xl text-[13px] font-bold text-text-3 border border-border/20 uppercase tracking-widest opacity-50">
             Versiyon 1.0.0-Beta
           </div>
        </div>
        
        <div className="text-center opacity-30 pt-20">
          <p className="text-[11px] text-text-3 font-bold uppercase tracking-widest">© Helios Bilim ve Teknoloji A.Ş. • Dijital Dönüşüm Departmanı</p>
        </div>
      </div>
    </div>
  );
};
