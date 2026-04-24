import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ModuleConfig, ModuleId, User } from '../types/portal';
import {
  LayoutGrid,
  Calendar,
  ClipboardCheck,
  CalendarClock,
  Book,
  ShoppingCart,
  Columns,
  DollarSign,
  BarChart3,
  FolderOpen,
  Users,
  UserCheck,
  Megaphone,
  FileText,
  TrendingDown,
  FlaskConical,
  Package,
  Globe,
  MessageSquare,
  ChevronRight,
  Zap,
  Trash2,
  Phone,
  BookOpen,
  StickyNote,
  Settings,
} from 'lucide-react';
import { cn } from '../lib/utils';

const MODULES: ModuleConfig[] = [
  { id: 'pano', title: 'Pano', icon: 'pano', color: 'bg-indigo-50 text-indigo-500 border-indigo-200' },
  { id: 'takvim', title: 'Takvim', icon: 'takvim', color: 'bg-orange-50 text-orange-500' },
  { id: 'lab-checklist', title: 'Lab checklist', icon: 'lab-checklist', color: 'bg-emerald-50 text-emerald-500' },
  { id: 'izin-mazeret', title: 'İzin / mazeret', icon: 'izin-mazeret', color: 'bg-blue-50 text-blue-500' },
  { id: 'lab-book', title: 'Lab book', icon: 'lab-book', color: 'bg-emerald-50 text-emerald-500' },
  { id: 'satin-alma', title: 'Satın alma', icon: 'satin-alma', color: 'bg-pink-50 text-pink-500' },
  { id: 'board', title: 'Board', icon: 'board', color: 'bg-purple-50 text-purple-500' },
  { id: 'on-muhasebe', title: 'Ön muhasebe', icon: 'on-muhasebe', color: 'bg-emerald-50 text-emerald-500' },
  { id: 'satis', title: 'Satış', icon: 'satis', color: 'bg-pink-50 text-pink-500' },
  { id: 'projeler', title: 'Projeler', icon: 'projeler', color: 'bg-purple-50 text-purple-500' },
  { id: 'kartvizitler', title: 'Kartvizitler', icon: 'kartvizitler', color: 'bg-indigo-50 text-indigo-500' },
  { id: 'onboarding', title: 'Onboarding', icon: 'onboarding', color: 'bg-orange-50 text-orange-500' },
  { id: 'basin', title: 'Basın', icon: 'basin', color: 'bg-pink-50 text-pink-500' },
  { id: 'sop-prosedur', title: 'SOP / Prosedür', icon: 'sop-prosedur', color: 'bg-emerald-50 text-emerald-500' },
  { id: 'runway', title: 'Runway', icon: 'runway', color: 'bg-orange-50 text-orange-500' },
  { id: 'arge-plani', title: 'Ar-Ge Planı', icon: 'arge-plani', color: 'bg-purple-50 text-purple-500' },
  { id: 'lab-stok', title: 'Lab Stok', icon: 'lab-stok', color: 'bg-emerald-50 text-emerald-500' },
  { id: 'distributor', title: 'Distribütör', icon: 'distributor', color: 'bg-purple-50 text-purple-500' },
  { id: 'kullanicilar', title: 'Kullanıcılar', icon: 'kullanicilar', color: 'bg-slate-50 text-slate-500' },
];

interface DashboardProps {
  onModuleSelect: (id: ModuleId) => void;
  currentUser: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ onModuleSelect, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'duyurular' | 'rehber' | 'künye' | 'notlar'>('duyurular');

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'pano': return <LayoutGrid size={22} />;
      case 'takvim': return <Calendar size={22} />;
      case 'lab-checklist': return <ClipboardCheck size={22} />;
      case 'izin-mazeret': return <CalendarClock size={22} />;
      case 'lab-book': return <Book size={22} />;
      case 'satin-alma': return <ShoppingCart size={22} />;
      case 'board': return <Columns size={22} />;
      case 'on-muhasebe': return <DollarSign size={22} />;
      case 'satis': return <BarChart3 size={22} />;
      case 'projeler': return <FolderOpen size={22} />;
      case 'kartvizitler': return <Users size={22} />;
      case 'onboarding': return <UserCheck size={22} />;
      case 'basin': return <Megaphone size={22} />;
      case 'sop-prosedur': return <FileText size={22} />;
      case 'runway': return <TrendingDown size={22} />;
      case 'arge-plani': return <FlaskConical size={22} />;
      case 'lab-stok': return <Package size={22} />;
      case 'distributor': return <Globe size={22} />;
      case 'kullanicilar': return <Settings size={22} />;
      default: return <LayoutGrid size={22} />;
    }
  };

  const visibleModules = MODULES.filter((m) =>
    m.id === 'pano' ||
    currentUser.userRole === 'yonetici' ||
    currentUser.allowedModules.includes(m.id)
  );

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-12">
      {/* Applications Grid */}
      <section>
        <h3 className="text-[13px] font-semibold text-text-3 mb-6">Uygulamalar</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {visibleModules.map((module) => (
            <motion.div
              key={module.id}
              whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onModuleSelect(module.id)}
              className={cn(
                "bg-white border border-border/40 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all",
                module.id === 'pano' && "border-[#378ADD] ring-1 ring-[#378ADD]/10"
              )}
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-transform", module.color)}>
                {getIcon(module.icon)}
              </div>
              <h4 className="text-[13px] font-semibold text-text text-center leading-tight">{module.title}</h4>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* News Section */}
        <div className="lg:col-span-2 bg-white border border-border/40 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-150">
          <div className="px-6 py-4 border-b border-border/40 flex items-center gap-6">
             <button onClick={() => setActiveTab('duyurular')} className={cn("flex items-center gap-2 py-2 border-b-2 transition-all text-[14px] font-bold", activeTab === 'duyurular' ? "border-text text-text" : "border-transparent text-text-3 hover:text-text")}>
               <MessageSquare size={16} /> Duyurular <span className="bg-surface-2 text-text-3 text-[10px] px-1.5 rounded-full">3</span>
             </button>
             <button onClick={() => setActiveTab('rehber')} className={cn("flex items-center gap-2 py-2 border-b-2 transition-all text-[14px] font-bold", activeTab === 'rehber' ? "border-text text-text" : "border-transparent text-text-3 hover:text-text")}>
               <Phone size={16} /> Rehber <span className="bg-surface-2 text-text-3 text-[10px] px-1.5 rounded-full">20</span>
             </button>
             <button onClick={() => setActiveTab('künye')} className={cn("flex items-center gap-2 py-2 border-b-2 transition-all text-[14px] font-bold", activeTab === 'künye' ? "border-text text-text" : "border-transparent text-text-3 hover:text-text")}>
               <BookOpen size={16} /> Künye
             </button>
             <button onClick={() => setActiveTab('notlar')} className={cn("flex items-center gap-2 py-2 border-b-2 transition-all text-[14px] font-bold", activeTab === 'notlar' ? "border-text text-text" : "border-transparent text-text-3 hover:text-text")}>
               <StickyNote size={16} /> Notlar <span className="bg-surface-2 text-text-3 text-[10px] px-1.5 rounded-full">11</span>
             </button>
          </div>
          
          <div className="p-8 flex-1 flex flex-col">
             <div className="flex items-center justify-between mb-8">
               <p className="text-[13px] text-text-3 font-medium">Ekibin göreceği duyurular</p>
               <button className="flex items-center gap-2 bg-[#1a1a19] text-white px-4 py-2 rounded-lg text-[13px] font-bold shadow-sm hover:bg-black transition-all">
                 + Duyuru ekle
               </button>
             </div>

             <div className="space-y-4">
                {[
                  { id: 1, type: 'ÖNEMLİ', title: 'Pazartesi toplantısı', date: '18 Nis', user: 'Gizem Uysal', initials: 'GU', content: "Haftalık sync 10:00'da. Gündem: CALF-20 scale-up ilerlemesi.", color: 'bg-amber-100 text-amber-800' },
                  { id: 2, type: 'ACİL', title: 'TÜBİTAK 1501 başvuru son tarihi yaklaşıyor', date: '17 Nis', user: 'Gizem Uysal', initials: 'GU', content: "Teknik ekip proposal draftını hafta sonu gözden geçirecek.", color: 'bg-red-100 text-red-800' },
                  { id: 3, type: 'NORMAL', title: 'Teknopark park kartları güncellendi', date: '15 Nis', user: 'Busenur Kutlu Kara', initials: 'BK', content: "Yeni kartlar danışmada. Eskileri lütfen iade edin.", color: 'bg-surface-2 text-text-2' },
                ].map(item => (
                  <div key={item.id} className="p-6 border border-border/60 rounded-xl bg-white hover:shadow-md transition-shadow group relative">
                    <div className="flex items-center gap-3 mb-3">
                       <span className={cn("text-[9px] font-black px-2 py-0.5 rounded tracking-widest", item.color)}>{item.type}</span>
                       <h4 className="text-[15px] font-bold text-text-2">{item.title}</h4>
                    </div>
                    <p className="text-[14px] text-text-2 mb-4 leading-relaxed">{item.content}</p>
                    <div className="flex items-center justify-between text-[11px] text-text-3 font-medium">
                       <div className="flex items-center gap-2">
                          <span className="text-[#010D52] font-bold">{item.initials}</span>
                          <span>{item.user}</span>
                          <span>- {item.date}</span>
                       </div>
                       <button className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-red-border transition-all flex items-center gap-1">
                         <Trash2 size={12} /> sil
                       </button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="bg-white border border-border/40 rounded-2xl shadow-sm p-6 space-y-6">
           <div className="flex items-center justify-between">
              <h4 className="text-[15px] font-bold flex items-center gap-2">
                <Zap size={18} className="text-[#010D52]" /> Hızlı linkler
              </h4>
              <button className="text-[11px] font-bold text-text-3 hover:text-text border border-border/40 px-2 py-0.5 rounded transition-all">Düzenle</button>
           </div>
           
           <div className="space-y-2">
              {[
                { name: 'Data Room', desc: 'Yatırımcı due diligence klasörü', initial: 'D', color: 'bg-red-50 text-red-500' },
                { name: 'TDS / SDS / Katalog', desc: 'Ürün teknik föyleri, güvenlik bilgi formları, katalog', initial: 'T', color: 'bg-emerald-50 text-emerald-500' },
                { name: 'İş Geliştirme Drive', desc: 'Hibe, yatırım, pazarlama, sözleşmeler', initial: 'i', color: 'bg-amber-50 text-amber-500' },
                { name: 'Ar-Ge Drive', desc: 'Deney sonuçları, makaleler, teknik dosyalar', initial: 'A', color: 'bg-teal-50 text-teal-500' },
                { name: 'Helios sunumu', desc: 'Yatırımcı / tanıtım sunumu', initial: 'H', color: 'bg-indigo-50 text-indigo-500' },
                { name: 'Helios web sitesi', desc: 'heliosscitech.com', initial: 'H', color: 'bg-teal-50 text-teal-500' },
                { name: 'Teknopark Ar-Ge Portalı', desc: 'Teknopark İstanbul proje takibi', initial: 'T', color: 'bg-emerald-50 text-emerald-500' },
                { name: 'TÜBİTAK PRODİS', desc: '', initial: 'T', color: 'bg-blue-50 text-blue-500' },
              ].map((link, idx) => (
                <a key={idx} href="#" className="flex items-center gap-4 p-3 border border-transparent hover:border-border/40 hover:bg-surface rounded-xl transition-all group">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[14px] shrink-0", link.color)}>
                    {link.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-text-2 truncate">{link.name}</p>
                    {link.desc && <p className="text-[11px] text-text-3 truncate">{link.desc}</p>}
                  </div>
                  <ChevronRight size={14} className="text-text-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                </a>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
