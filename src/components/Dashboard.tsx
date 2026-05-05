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
  Phone,
  BookOpen,
  StickyNote,
  Settings,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAnnouncements, useDirectory, useNotes } from './dashboard/hooks';
import { DuyurularPanel } from './dashboard/DuyurularPanel';
import { RehberPanel } from './dashboard/RehberPanel';
import { KunyePanel } from './dashboard/KunyePanel';
import { NotlarPanel } from './dashboard/NotlarPanel';
import { QuickLinksPanel } from './dashboard/QuickLinksPanel';

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
  const announcements = useAnnouncements(currentUser.id);
  const directory = useDirectory();
  const notes = useNotes(currentUser.id);

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
          <div className="px-6 py-4 border-b border-border/40 flex items-center gap-6 overflow-x-auto">
             <button onClick={() => setActiveTab('duyurular')} className={cn("flex items-center gap-2 py-2 border-b-2 transition-all text-[14px] font-bold whitespace-nowrap", activeTab === 'duyurular' ? "border-text text-text" : "border-transparent text-text-3 hover:text-text")}>
               <MessageSquare size={16} /> Duyurular <span className="bg-surface-2 text-text-3 text-[10px] px-1.5 rounded-full">{announcements.items.length}</span>
             </button>
             <button onClick={() => setActiveTab('rehber')} className={cn("flex items-center gap-2 py-2 border-b-2 transition-all text-[14px] font-bold whitespace-nowrap", activeTab === 'rehber' ? "border-text text-text" : "border-transparent text-text-3 hover:text-text")}>
               <Phone size={16} /> Rehber <span className="bg-surface-2 text-text-3 text-[10px] px-1.5 rounded-full">{directory.contacts.length}</span>
             </button>
             <button onClick={() => setActiveTab('künye')} className={cn("flex items-center gap-2 py-2 border-b-2 transition-all text-[14px] font-bold whitespace-nowrap", activeTab === 'künye' ? "border-text text-text" : "border-transparent text-text-3 hover:text-text")}>
               <BookOpen size={16} /> Künye
             </button>
             <button onClick={() => setActiveTab('notlar')} className={cn("flex items-center gap-2 py-2 border-b-2 transition-all text-[14px] font-bold whitespace-nowrap", activeTab === 'notlar' ? "border-text text-text" : "border-transparent text-text-3 hover:text-text")}>
               <StickyNote size={16} /> Notlar <span className="bg-surface-2 text-text-3 text-[10px] px-1.5 rounded-full">{notes.items.length}</span>
             </button>
          </div>

          <div className="p-8 flex-1 flex flex-col">
            {activeTab === 'duyurular' && <DuyurularPanel currentUser={currentUser} />}
            {activeTab === 'rehber'    && <RehberPanel />}
            {activeTab === 'künye'     && <KunyePanel />}
            {activeTab === 'notlar'    && <NotlarPanel currentUser={currentUser} />}
          </div>
        </div>

        <QuickLinksPanel />
      </div>
    </div>
  );
};
