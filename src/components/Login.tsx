import React, { useState } from 'react';
import type { User } from '../types/portal';
import { usePortalUsers } from '../lib/users';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: (user: User) => void;
}

const HeliosLogo = () => (
  <div className="flex flex-col items-center gap-2 mb-10">
    <div className="flex items-center gap-3">
      <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="8" fill="#010D52" />
        <circle cx="25" cy="50" r="10" fill="#010D52" />
        <circle cx="25" cy="75" r="8" fill="#010D52" />
        <circle cx="50" cy="50" r="12" fill="#010D52" />
        <circle cx="45" cy="30" r="6" fill="#010D52" />
        <circle cx="45" cy="70" r="6" fill="#010D52" />
        <path d="M25 50L50 50" stroke="#010D52" strokeWidth="2" opacity="0.3" />
        <path d="M25 25L45 30" stroke="#010D52" strokeWidth="2" opacity="0.1" />
        <path d="M25 75L45 70" stroke="#010D52" strokeWidth="2" opacity="0.1" />
      </svg>
      <span className="text-[42px] font-bold text-[#010D52] tracking-tight">helios</span>
    </div>
    <span className="text-[14px] text-text-3 font-medium">İç portal</span>
  </div>
);

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { users } = usePortalUsers();
  const [selectedUser, setSelectedUser] = useState<User>(users[0]);
  const [password, setPassword] = useState('helios2026');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'helios2026') {
      onLogin(selectedUser);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#f5f7f9] flex items-center justify-center p-5 z-100 overflow-y-auto">
      <div className="relative w-full max-w-110 bg-white border border-border/40 rounded-[20px] p-10 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] scale-in">
        <HeliosLogo />

        <h3 className="text-[13px] font-semibold text-text-3 mb-4">Kim olarak giriyorsun?</h3>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={cn(
                "flex items-center gap-3 p-2.5 border rounded-xl transition-all text-left group",
                selectedUser?.id === user.id
                  ? "bg-[#E6F1FB] border-[#378ADD] ring-1 ring-[#378ADD]/20"
                  : "bg-surface border-border hover:border-border-strong hover:bg-white"
              )}
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0", user.color)}>
                {user.initials}
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-semibold text-text truncate block">{user.name}</span>
                {user.userRole === 'yonetici' && (
                  <span className="text-[10px] text-text-3 font-medium">Yönetici</span>
                )}
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-text-2">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 text-[14px] border border-border rounded-xl outline-none focus:border-text focus:ring-4 focus:ring-black/5 transition-all text-center tracking-[8px]"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none py-1">
            <input type="checkbox" className="w-4 h-4 rounded border-border accent-text" defaultChecked />
            <span className="text-[13px] text-text-2">Beni hatırla</span>
          </label>

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-[#1a1a19] text-white font-bold text-[14px] hover:bg-black transition-all shadow-lg active:scale-[0.98]"
          >
            Giriş yap
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-border/50 text-[12px] text-text-3 text-center">
          Prototip • ortak şifre: <code className="bg-surface-2 px-1.5 py-0.5 rounded text-text font-mono">helios2026</code>
        </div>
      </div>
    </div>
  );
};
