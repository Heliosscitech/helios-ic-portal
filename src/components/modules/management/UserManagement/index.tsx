import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, User as UserIcon, Check } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { usePortalUsers } from '../../../../lib/users';
import { ALL_MODULE_IDS } from '../../../../types/users';
import type { ModuleId, Responsibility, User, UserRole } from '../../../../types/portal';
import { Breadcrumb } from '../../../BreadcrumbHome';

interface UserManagementProps {
  currentUserId: string;
}

const COLOR_PRESETS = [
  'bg-indigo-100 text-indigo-700',
  'bg-purple-100 text-purple-700',
  'bg-emerald-100 text-emerald-700',
  'bg-pink-100 text-pink-700',
  'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
  'bg-yellow-100 text-yellow-700',
];

const MODULE_INFO: { id: ModuleId; label: string; group: string }[] = [
  { id: 'takvim', label: 'Takvim', group: 'Ekip' },
  { id: 'board', label: 'Board', group: 'Ekip' },
  { id: 'kartvizitler', label: 'Kartvizitler', group: 'Ekip' },
  { id: 'izin-mazeret', label: 'İzin / Mazeret', group: 'İK' },
  { id: 'onboarding', label: 'Onboarding', group: 'İK' },
  { id: 'lab-checklist', label: 'Lab Checklist', group: 'Lab' },
  { id: 'lab-book', label: 'Lab Book', group: 'Lab' },
  { id: 'lab-stok', label: 'Lab Stok', group: 'Lab' },
  { id: 'sop-prosedur', label: 'SOP / Prosedür', group: 'Lab' },
  { id: 'arge-plani', label: 'Ar-Ge Planı', group: 'Lab' },
  { id: 'satin-alma', label: 'Satın Alma', group: 'Yönetim' },
  { id: 'on-muhasebe', label: 'Ön Muhasebe', group: 'Yönetim' },
  { id: 'satis', label: 'Satış', group: 'Yönetim' },
  { id: 'projeler', label: 'Projeler', group: 'Yönetim' },
  { id: 'basin', label: 'Basın', group: 'Yönetim' },
  { id: 'runway', label: 'Runway', group: 'Yönetim' },
  { id: 'distributor', label: 'Distribütör', group: 'Yönetim' },
];

const MODULE_GROUPS = [...new Set(MODULE_INFO.map((m) => m.group))];

const RESPONSIBILITY_INFO: { id: Responsibility; label: string; description: string }[] = [
  {
    id: 'purchasing',
    label: 'Satın alma sorumlusu',
    description: 'Talepleri yönetir, atanır, statü günceller.',
  },
];

const getAutoInitials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

export const UserManagement: React.FC<UserManagementProps> = ({ currentUserId }) => {
  const { users, loading, updateUser } = usePortalUsers();
  const [editUser, setEditUser] = useState<User | null>(null);

  return (
    <div className="max-w-3xl mx-auto p-8 md:p-10 space-y-6">
      <Breadcrumb title="Kullanıcı Yönetimi" />
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-[17px] font-semibold text-text tracking-tight mb-1">Kullanıcı Yönetimi</h2>
          <p className="text-[13px] text-text-3">Ekip üyelerinin rolleri ve modül erişimleri</p>
        </div>
        <div className="text-[11px] text-text-3 max-w-56 text-right leading-relaxed">
          Yeni kullanıcı eklemek için Supabase Studio → Authentication panelini kullanın
        </div>
      </div>

      {loading && (
        <div className="text-[12px] text-text-3 mb-4">Yükleniyor…</div>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white border-[0.5px] border-border rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm"
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-[13px] shrink-0', user.color)}>
              {user.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-text">{user.name}</p>
              <p className="text-[12.5px] text-text-3 mt-0.5">{user.role || '—'}</p>
            </div>
            <span className={cn(
              'px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0',
              user.userRole === 'yonetici' ? 'bg-[#1a1a19] text-white' : 'bg-surface-2 text-text-3'
            )}>
              {user.userRole === 'yonetici' ? 'Yönetici' : 'Çalışan'}
            </span>
            {user.userRole === 'calisan' && (
              <span className="text-[11px] text-text-3 shrink-0">
                {user.allowedModules.filter(m => m !== 'pano').length} modül
              </span>
            )}
            <button
              onClick={() => setEditUser(user)}
              className="px-3 py-1.5 text-[12.5px] font-semibold text-text-2 hover:bg-surface-2 rounded-lg transition-colors shrink-0"
            >
              Düzenle
            </button>
          </div>
        ))}
      </div>

      {editUser && (
        <UserFormModal
          key={editUser.id}
          user={editUser}
          currentUserId={currentUserId}
          onClose={() => setEditUser(null)}
          onSave={(patch) => { updateUser(editUser.id, patch); setEditUser(null); }}
        />
      )}
    </div>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────

interface UserFormModalProps {
  user: User;
  currentUserId: string;
  onClose: () => void;
  onSave: (data: Partial<User>) => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  user,
  currentUserId,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(user.name);
  const [initials, setInitials] = useState(user.initials);
  const [roleTitle, setRoleTitle] = useState(user.role);
  const [color, setColor] = useState(user.color);
  const [userRole, setUserRole] = useState<UserRole>(user.userRole);
  const [allowedModules, setAllowedModules] = useState<ModuleId[]>([...user.allowedModules]);
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>([...user.responsibilities]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const toggleModule = (id: ModuleId) =>
    setAllowedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );

  const toggleResponsibility = (id: Responsibility) =>
    setResponsibilities((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('İsim zorunlu.'); return; }
    const finalInitials = initials.trim() || getAutoInitials(name);
    const finalAllowed: ModuleId[] = userRole === 'yonetici' ? [...ALL_MODULE_IDS] : allowedModules;
    const finalResp: Responsibility[] =
      userRole === 'yonetici'
        ? Array.from(new Set<Responsibility>([...responsibilities, 'purchasing']))
        : responsibilities;
    onSave({
      name: name.trim(),
      initials: finalInitials,
      role: roleTitle,
      color,
      userRole,
      allowedModules: finalAllowed,
      responsibilities: finalResp,
    });
  };

  const isSelf = user?.id === currentUserId;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-lg mt-16 mb-8 overflow-hidden"
        >
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-text">Kullanıcıyı düzenle</h3>
              <button type="button" onClick={onClose} className="p-1.5 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="px-3 py-2 bg-red-bg text-red-text border border-red-border/30 rounded-lg text-[13px] font-semibold">{error}</div>
              )}

              {/* Name + Initials */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-widest text-text-3">İsim *</label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adı Soyadı"
                    className="w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-widest text-text-3">Kısaltma</label>
                  <input
                    value={initials}
                    onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="AB"
                    className="w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors font-semibold text-center tracking-widest"
                  />
                </div>
              </div>

              {/* Position */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-text-3">Unvan / Pozisyon</label>
                <input
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="Ar-Ge Uzmanı"
                  className="w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-text transition-colors"
                />
              </div>

              {/* Color */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-text-3">Avatar Rengi</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={cn(
                        'w-9 h-9 rounded-lg font-semibold text-[10.5px] transition-all border-2',
                        c,
                        color === c ? 'border-[#1a1a19] scale-110 shadow' : 'border-transparent'
                      )}
                    >
                      {color === c ? <Check size={14} className="mx-auto" /> : 'Aa'}
                    </button>
                  ))}
                </div>
              </div>

              {/* User role */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-text-3">Rol</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['yonetici', 'calisan'] as UserRole[]).map((r) => {
                    const disabled = isSelf;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => !disabled && setUserRole(r)}
                        disabled={disabled}
                        className={cn(
                          'flex items-center gap-2.5 p-3 border-2 rounded-xl text-[13px] font-semibold transition-all',
                          userRole === r
                            ? 'border-[#1a1a19] bg-[#1a1a19] text-white'
                            : 'border-border text-text-2 hover:bg-surface-2',
                          disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                        )}
                      >
                        {r === 'yonetici' ? <Shield size={15} /> : <UserIcon size={15} />}
                        {r === 'yonetici' ? 'Yönetici' : 'Çalışan'}
                      </button>
                    );
                  })}
                </div>
                {isSelf && (
                  <p className="text-[11px] text-text-3 italic mt-1.5">
                    Kendi rolünüzü değiştiremezsiniz (lock-out riskini önlemek için).
                  </p>
                )}
              </div>

              {/* Module access */}
              {userRole === 'calisan' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-text-3">Modül Erişimi</label>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setAllowedModules([...ALL_MODULE_IDS])}
                        className="text-[11px] font-semibold text-text-3 hover:text-text underline">
                        Tümünü seç
                      </button>
                      <button type="button" onClick={() => setAllowedModules(['pano'])}
                        className="text-[11px] font-semibold text-text-3 hover:text-text underline">
                        Temizle
                      </button>
                    </div>
                  </div>
                  <div className="border border-border rounded-xl overflow-hidden">
                    {MODULE_GROUPS.map((group, gi) => (
                      <div key={group}>
                        {gi > 0 && <div className="border-t border-border/40" />}
                        <div className="px-3 py-1.5 bg-surface-2/40">
                          <span className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3">{group}</span>
                        </div>
                        {MODULE_INFO.filter((m) => m.group === group).map((mod) => {
                          const checked = allowedModules.includes(mod.id);
                          return (
                            <div
                              key={mod.id}
                              onClick={() => toggleModule(mod.id)}
                              className={cn(
                                'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-t border-border/20',
                                checked ? 'bg-surface-2/30' : 'hover:bg-surface-2/20'
                              )}
                            >
                              <div className={cn(
                                'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                                checked ? 'bg-[#1a1a19] border-[#1a1a19]' : 'border-border'
                              )}>
                                {checked && <Check size={10} color="white" strokeWidth={3} />}
                              </div>
                              <span className="text-[13px] text-text-2 font-medium select-none">{mod.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 bg-surface-2/40 rounded-xl border border-border/40 text-[13px] text-text-3 flex items-center gap-2">
                  <Shield size={14} />
                  Yöneticiler tüm modüllere erişebilir
                </div>
              )}

              {/* Responsibilities */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-text-3">Sorumluluklar</label>
                {userRole === 'yonetici' ? (
                  <div className="px-4 py-3 bg-surface-2/40 rounded-xl border border-border/40 text-[13px] text-text-3 flex items-center gap-2">
                    <Shield size={14} />
                    Yöneticiler tüm sorumluluk yetkilerine sahiptir
                  </div>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden">
                    {RESPONSIBILITY_INFO.map((r, i) => {
                      const checked = responsibilities.includes(r.id);
                      return (
                        <div
                          key={r.id}
                          onClick={() => toggleResponsibility(r.id)}
                          className={cn(
                            'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
                            i > 0 && 'border-t border-border/20',
                            checked ? 'bg-surface-2/30' : 'hover:bg-surface-2/20'
                          )}
                        >
                          <div className={cn(
                            'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors mt-0.5',
                            checked ? 'bg-[#1a1a19] border-[#1a1a19]' : 'border-border'
                          )}>
                            {checked && <Check size={10} color="white" strokeWidth={3} />}
                          </div>
                          <div className="select-none">
                            <div className="text-[13px] text-text-2 font-medium">{r.label}</div>
                            <div className="text-[11.5px] text-text-3 mt-0.5">{r.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/40 bg-surface-2/30 flex items-center justify-end gap-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 border border-border rounded-lg text-[13px] font-semibold text-text-2 hover:bg-surface-2 transition-colors">
                Vazgeç
              </button>
              <button type="submit"
                className="px-5 py-2 text-white rounded-lg text-[13px] font-semibold bg-[#1a1a19] shadow-sm hover:bg-black transition-colors">
                Kaydet
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
