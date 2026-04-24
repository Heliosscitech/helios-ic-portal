import React from 'react';
import { cn } from '../../../../../lib/utils';
import { usePortalUsers } from '../../../../../lib/users';
import type { User } from '../../../../../types/portal';
import { DEPARTMENTS } from '../types';

interface StepPersonProps {
  employee: User;
  departman: string;
  managerId: string;
  email: string;
  onDepartmanChange: (v: string) => void;
  onManagerChange: (v: string) => void;
  onEmailChange: (v: string) => void;
}

const SELECT_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

export const StepPerson: React.FC<StepPersonProps> = ({
  employee,
  departman,
  managerId,
  email,
  onDepartmanChange,
  onManagerChange,
  onEmailChange,
}) => {
  const { users } = usePortalUsers();
  const managers = users.filter(
    (u) => u.userRole === 'yonetici' && u.id !== employee.id
  );

  return (
    <div className="bg-white border border-border/40 rounded-2xl p-10 shadow-sm space-y-10">
      <h2 className="text-[11px] font-semibold text-text-3 uppercase tracking-widest flex items-center gap-2">
        01 — KİŞİ BİLGİLERİ
      </h2>

      <div className="bg-[#f1efe8]/50 border border-border/20 rounded-xl p-4 flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-[12.5px] shadow-sm',
            employee.color
          )}
        >
          {employee.initials}
        </div>
        <span className="text-[15px] font-semibold text-text">{employee.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-text-2">
            Departman <span className="text-red-500">*</span>
          </label>
          <select
            value={departman}
            onChange={(e) => onDepartmanChange(e.target.value)}
            className="w-full p-4 border border-border rounded-xl text-[14px] outline-none appearance-none bg-white font-medium"
            style={{
              backgroundImage: SELECT_BG,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1rem',
            }}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.label}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-text-2">
            Yönetici <span className="text-red-500">*</span>
          </label>
          <select
            value={managerId}
            onChange={(e) => onManagerChange(e.target.value)}
            className="w-full p-4 border border-border rounded-xl text-[14px] outline-none appearance-none bg-white font-medium"
            style={{
              backgroundImage: SELECT_BG,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1rem',
            }}
          >
            <option value="">Seçiniz...</option>
            {managers.length === 0 ? (
              <option disabled>Kayıtlı yönetici yok</option>
            ) : (
              managers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[13px] font-semibold text-text-2">
          Kurumsal e-posta <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="w-full p-4 border border-border rounded-xl text-[14px] outline-none focus:border-text transition-all font-medium pr-32"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-3 text-[13px] font-medium opacity-60">
            @heliosscitech.com
          </span>
        </div>
      </div>
    </div>
  );
};
