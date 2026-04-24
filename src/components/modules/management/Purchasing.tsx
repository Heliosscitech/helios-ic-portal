import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  Search,
  Package,
  MoreHorizontal,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../../lib/utils';

type Category = 'all' | 'kimyasal' | 'sarf' | 'ekipman' | 'hizmet' | 'arizalanan';

interface PurchaseRequest {
  id: string;
  title: string;
  category: Exclude<Category, 'all'>;
  requester: string;
  date: string;
  status: 'yeni' | 'onaylandi' | 'siparis' | 'geldi' | 'iptal';
  description: string;
  urgent: boolean;
}

const INITIAL_PURCHASES: PurchaseRequest[] = [
  { id: 'PR-102', title: 'Analitik Terazi Hassas Kalibrasyon', category: 'hizmet', requester: 'Caner Aydın', date: '2 saat önce', status: 'yeni', description: 'Laboratuvar B-12 için hassas kalibrasyon gerekmektedir.', urgent: true },
  { id: 'PR-101', title: 'Nitril Eldiven (Large, 10 Kutu)', category: 'sarf', requester: 'Rezan Akbaş', date: 'Dün', status: 'siparis', description: 'Stok tükenmiştir, acil tedarik gerekiyor.', urgent: false },
  { id: 'PR-099', title: 'Hidroklorik Asit %37, 5L x 2', category: 'kimyasal', requester: 'Merve Erten', date: '3 gün önce', status: 'geldi', description: 'Standart stok yenileme.', urgent: false },
];

export const Purchasing: React.FC = () => {
  const [purchases] = useState<PurchaseRequest[]>(INITIAL_PURCHASES);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [showForm, setShowForm] = useState(false);

  const getStatusColor = (status: PurchaseRequest['status']) => {
    switch (status) {
      case 'yeni': return 'bg-info-bg text-info-text';
      case 'onaylandi': return 'bg-amber-bg text-amber-text';
      case 'siparis': return 'bg-purple-bg text-purple-text';
      case 'geldi': return 'bg-teal-bg text-teal-text';
      default: return 'bg-surface-2 text-text-3';
    }
  };

  const getCategoryColor = (category: PurchaseRequest['category']) => {
    switch (category) {
      case 'kimyasal': return 'border-l-[#3C3489]';
      case 'sarf': return 'border-l-[#0F6E56]';
      case 'ekipman': return 'border-l-[#BA7517]';
      case 'arizalanan': return 'border-l-red-border';
      case 'hizmet': return 'border-l-info-border';
      default: return 'border-l-border';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight mb-1">Satın Alma Yönetimi</h2>
          <p className="text-text-3 text-[14px]">Malzeme ve hizmet taleplerini buradan yönetebilirsiniz.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-text text-white px-5 py-2.5 rounded-xl font-bold text-[14px] hover:bg-black/80 transition-all shadow-lg active:scale-95"
        >
          <Plus size={18} /> Yeni Talep
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-10"
          >
            <div className="bg-surface-2/50 border-[0.5px] border-border rounded-2xl p-8">
              <h3 className="text-[15px] font-bold mb-6">Yeni Malzeme/Hizmet Talebi Oluştur</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-text-3 uppercase">Talep Başlığı</label>
                  <input type="text" placeholder="Örn: Nitril Eldiven Alımı" className="w-full p-3 bg-white border border-border rounded-lg outline-none focus:border-text transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-text-3 uppercase">Kategori</label>
                  <select className="w-full p-3 bg-white border border-border rounded-lg outline-none focus:border-text transition-all">
                    <option>Kategori Seçiniz</option>
                    <option>Kimyasal</option>
                    <option>Sarf Malzeme</option>
                    <option>Ekipman</option>
                    <option>Arizalanan/Onarım</option>
                    <option>Hizmet Alımı</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                   <label className="text-[12px] font-bold text-text-3 uppercase">Detaylar & Teknik Özellikler</label>
                   <textarea rows={3} className="w-full p-3 bg-white border border-border rounded-lg outline-none focus:border-text transition-all resize-none"></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                 <button onClick={() => setShowForm(false)} className="px-6 py-2.5 text-[13px] font-bold text-text-2 hover:bg-white rounded-lg transition-all">İptal</button>
                 <button className="px-6 py-2.5 bg-text text-white text-[13px] font-bold rounded-lg hover:opacity-90 shadow-md">Talebi Gönder</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
           <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
           <input type="text" placeholder="Taleplerde ara..." className="w-full pl-10 pr-4 py-2.5 bg-surface border-[0.5px] border-border rounded-xl text-[14px] outline-none focus:border-text transition-all" />
        </div>
        <div className="flex gap-2 p-1 bg-surface-2 rounded-xl overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'kimyasal', label: 'Kimyasal' },
            { id: 'sarf', label: 'Sarf' },
            { id: 'ekipman', label: 'Ekipman' },
            { id: 'hizmet', label: 'Hizmet' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as Category)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[13px] font-bold whitespace-nowrap transition-all",
                activeCategory === cat.id ? "bg-text text-white shadow-sm" : "text-text-3 hover:text-text"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {purchases.map((pr) => (
          <div 
            key={pr.id} 
            className={cn(
              "group bg-surface border-[0.5px] border-border rounded-2xl p-6 transition-all hover:border-text/20 hover:shadow-lg hover:-translate-y-0.5 border-l-[6px]",
              getCategoryColor(pr.category)
            )}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[11px] font-mono font-bold text-text-3 bg-surface-2 px-2 py-0.5 rounded leading-none">{pr.id}</span>
                  <h4 className="text-[16px] font-bold text-text">{pr.title}</h4>
                  {pr.urgent && (
                    <span className="text-[9px] font-extrabold uppercase tracking-widest bg-red-bg text-red-text px-2 py-0.5 rounded-full border border-red-border/20 animate-pulse">ACİL</span>
                  )}
                </div>
                <p className="text-[13px] text-text-2 leading-relaxed max-w-2xl">{pr.description}</p>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-text-3 font-medium">
                   <div className="flex items-center gap-2">
                     <div className="w-5 h-5 rounded-full bg-surface-2 flex items-center justify-center text-[10px]">RA</div>
                     {pr.requester}
                   </div>
                   <div className="flex items-center gap-2">
                     <Package size={14} className="opacity-50" />
                     <span className="capitalize">{pr.category}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <ShoppingCart size={14} className="opacity-50" />
                     {pr.date}
                   </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-4 min-w-35">
                <div className={cn("px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider", getStatusColor(pr.status))}>
                  {pr.status}
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors">
                    <ExternalLink size={18} />
                  </button>
                  <button className="p-2 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
               <div className="flex gap-2">
                 <button className="text-[11px] font-bold text-text hover:underline">Detayları Gör</button>
                 <span className="text-border">|</span>
                 <button className="text-[11px] font-bold text-text hover:underline">Teklifleri İncele (2)</button>
               </div>
               <button className="flex items-center gap-1.5 text-[12px] font-bold text-text-2 hover:text-text">
                 Gelişmiş İşlemler <ChevronDown size={14} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
