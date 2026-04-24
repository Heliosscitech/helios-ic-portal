import React from 'react';
import { Header } from './Header';
import type { User } from '../../types/portal';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  onGoHome: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onGoHome }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} onLogout={onLogout} onGoHome={onGoHome} />
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </main>
      <footer className="py-6 border-t-[0.5px] border-border text-center">
        <p className="text-[11px] text-text-3 uppercase tracking-[2px]">Helios Kurumsal Sistemler • 2026</p>
      </footer>
    </div>
  );
};
