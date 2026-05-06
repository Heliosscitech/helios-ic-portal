import React, { useState } from 'react';
import type { User } from '../../types/portal';
import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NotificationsBell } from './NotificationsBell';
import { ProfileModal } from '../modals/ProfileModal';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, onGoHome }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const openProfile = () => { setMenuOpen(false); setProfileOpen(true); };

  return (
    <>
    <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-border/40 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-10">
        <div 
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={onGoHome}
        >
          <img src="/logo-light.png" alt="Helios" className="h-8 w-auto" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1 bg-surface-2 p-1 rounded-lg border border-border/20">
           <button className="px-3 py-1.5 text-[12px] font-bold text-info-text bg-white rounded-md shadow-sm">Portal</button>
           <button className="px-3 py-1.5 text-[12px] font-semibold text-text-3 hover:text-text transition-colors">Ekip</button>
        </div>

        <NotificationsBell />

        <div className="relative">
          <div 
            className={cn(
              "flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full cursor-pointer transition-all",
              menuOpen ? "bg-surface-2" : "hover:bg-surface-2"
            )}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="hidden md:block text-[13px] font-semibold text-text">{user.name}</span>
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[12px] shadow-sm", user.color)}>
              {user.initials}
            </div>
            <ChevronDown size={14} className={cn("text-text-3 transition-transform", menuOpen && "rotate-180")} />
          </div>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-[-1]" onClick={() => setMenuOpen(false)}></div>
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-border/40 rounded-2xl shadow-2xl p-1 animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-border/40">
                   <p className="text-[13px] font-bold text-text">{user.name}</p>
                   <p className="text-[11px] text-text-3">{user.role}</p>
                </div>
                <div className="p-1">
                   <button onClick={openProfile} className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-text-2 hover:bg-surface-2 rounded-xl transition-colors">
                     <UserIcon size={16} /> Profilim
                   </button>
                </div>
                <div className="h-px bg-border/40 my-1 mx-2"></div>
                <div className="p-1">
                   <button 
                     onClick={onLogout}
                     className="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] text-red-text hover:bg-red-bg rounded-xl transition-colors font-semibold"
                   >
                     <LogOut size={16} /> Çıkış Yap
                   </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
    {profileOpen && <ProfileModal user={user} onClose={() => setProfileOpen(false)} />}
    </>
  );
};
