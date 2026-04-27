import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import {
  REGION_CONFIG,
  REGION_ORDER,
  STATUS_META,
  STATUS_ORDER,
  STEP_META,
  STEP_ORDER,
} from './constants';
import type {
  Distributor,
  DistributorContact,
  DistributorRegion,
  DistributorStatus,
  FollowUpStep,
  StepMap,
} from './types';
import type { User } from '../../../../types/portal';

interface Props {
  mode: 'create' | 'edit';
  distributor?: Distributor;
  users: User[];
  canManage: boolean;
  onSave: (patch: Partial<Distributor> | Distributor) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const labelCls = 'text-[11px] font-semibold uppercase tracking-widest text-text-3';
const inputCls =
  'w-full p-3 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors disabled:bg-surface-2/40 disabled:text-text-3 disabled:cursor-not-allowed';
const sectionCls = 'bg-surface-2/40 border border-border/40 rounded-xl p-5 space-y-4';

export const DistributorDetailModal: React.FC<Props> = ({
  mode,
  distributor,
  users,
  canManage,
  onSave,
  onDelete,
  onClose,
}) => {
  const isCreate = mode === 'create';
  const [region, setRegion] = useState<DistributorRegion>(distributor?.region ?? 'avrupa');
  const [country, setCountry] = useState<string>(distributor?.country ?? REGION_CONFIG['avrupa'].countries[0]);
  const [name, setName] = useState(distributor?.name ?? '');
  const [nameError, setNameError] = useState(false);
  const [website, setWebsite] = useState(distributor?.website ?? '');
  const [expertise, setExpertise] = useState(distributor?.expertise ?? '');
  const [contact1, setContact1] = useState<DistributorContact>(distributor?.contact1 ?? { name: '', title: '', email: '', phone: '' });
  const [contact2, setContact2] = useState<DistributorContact>(distributor?.contact2 ?? { name: '', title: '', email: '', phone: '' });
  const [steps, setSteps] = useState<StepMap>(
    distributor?.steps ?? STEP_ORDER.reduce((acc, s) => ({ ...acc, [s]: false }), {} as StepMap)
  );
  const [status, setStatus] = useState<DistributorStatus>(distributor?.status ?? 'arastirilacak');
  const [ownerId, setOwnerId] = useState<string>(distributor?.ownerId ?? '');
  const [nextStep, setNextStep] = useState(distributor?.nextStep ?? '');
  const [notes, setNotes] = useState(distributor?.notes ?? '');

  const countryOptions = useMemo(() => {
    const fromConfig = REGION_CONFIG[region].countries;
    if (mode === 'edit' && country && !fromConfig.includes(country)) {
      return [country, ...fromConfig];
    }
    return fromConfig;
  }, [region, country, mode]);

  // Bölge değişince ülke listesindeki ilkini seç
  useEffect(() => {
    if (mode === 'create' && !REGION_CONFIG[region].countries.includes(country)) {
      setCountry(REGION_CONFIG[region].countries[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const toggleStep = (id: FollowUpStep) => {
    if (!canManage) return;
    setSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    const finalOwnerId = ownerId === '' ? null : ownerId;
    if (isCreate) {
      const now = new Date().toISOString();
      onSave({
        region,
        country,
        name: name.trim(),
        website: website.trim(),
        expertise: expertise.trim(),
        contact1,
        contact2,
        steps,
        status,
        ownerId: finalOwnerId,
        nextStep: nextStep.trim(),
        notes: notes.trim(),
        createdAt: now,
        updatedAt: now,
      } as Partial<Distributor>);
    } else {
      onSave({
        region,
        country,
        name: name.trim(),
        website: website.trim(),
        expertise: expertise.trim(),
        contact1,
        contact2,
        steps,
        status,
        ownerId: finalOwnerId,
        nextStep: nextStep.trim(),
        notes: notes.trim(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

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
          className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-2xl mt-12 mb-8 overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-info-bg text-info-text">
                {country || REGION_CONFIG[region].label}
              </span>
              <h3 className="text-[15px] font-semibold text-text">
                {isCreate ? 'Yeni distribütör' : 'Distribütör detayı'}
              </h3>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Bölge + Ülke (create modunda her zaman; edit modunda da düzenlenebilir) */}
            {isCreate && (
              <div className={sectionCls}>
                <div className={labelCls}>BÖLGE & ÜLKE</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-text-2">Bölge</label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value as DistributorRegion)}
                      disabled={!canManage}
                      className={inputCls}
                    >
                      {REGION_ORDER.map((r) => (
                        <option key={r} value={r}>{REGION_CONFIG[r].label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-text-2">Ülke</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      disabled={!canManage}
                      className={inputCls}
                    >
                      {countryOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TEMEL BİLGİLER */}
            <div className={sectionCls}>
              <div className={labelCls}>TEMEL BİLGİLER</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-text-2">
                    Distribütör adı <span className="text-red-text">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError(false);
                    }}
                    disabled={!canManage}
                    placeholder="Bioneva"
                    className={cn(inputCls, nameError && 'border-red-border')}
                  />
                  {nameError && (
                    <p className="text-[11px] text-red-text">Distribütör adı zorunludur.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-text-2">Website</label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    disabled={!canManage}
                    placeholder="www.firma.com"
                    className={inputCls}
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[12px] font-semibold text-text-2">Uzmanlık alanı</label>
                  <input
                    type="text"
                    value={expertise}
                    onChange={(e) => setExpertise(e.target.value)}
                    disabled={!canManage}
                    placeholder="Dermokozmetik / Cilt Bakım"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* İLETİŞİM KİŞİSİ 1 */}
            <ContactSection
              titleLabel="İLETİŞİM KİŞİSİ 1"
              value={contact1}
              onChange={setContact1}
              disabled={!canManage}
            />

            {/* İLETİŞİM KİŞİSİ 2 */}
            <ContactSection
              titleLabel="İLETİŞİM KİŞİSİ 2"
              value={contact2}
              onChange={setContact2}
              disabled={!canManage}
            />

            {/* TAKİP ADIMLARI */}
            <div className={sectionCls}>
              <div className={labelCls}>TAKİP ADIMLARI</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {STEP_ORDER.map((stepId) => {
                  const meta = STEP_META[stepId];
                  const Icon = meta.icon;
                  const done = steps[stepId];
                  return (
                    <button
                      key={stepId}
                      type="button"
                      onClick={() => toggleStep(stepId)}
                      disabled={!canManage}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-[12px] font-semibold transition-all',
                        done
                          ? 'bg-teal-bg border-teal-text/40 text-teal-text'
                          : 'bg-white border-border text-text-2 hover:border-text/30',
                        !canManage && 'cursor-not-allowed opacity-70'
                      )}
                    >
                      <span
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                          done ? 'bg-teal-text border-teal-text' : 'border-border'
                        )}
                      >
                        {done && <Check size={10} color="white" strokeWidth={3} />}
                      </span>
                      <Icon size={13} className="opacity-70" />
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GÖRÜŞME DURUMU + SORUMLU */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Görüşme durumu</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DistributorStatus)}
                  disabled={!canManage}
                  className={inputCls}
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Sorumlu</label>
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  disabled={!canManage}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* SONRAKİ ADIM */}
            <div className="space-y-1.5">
              <label className={labelCls}>Sonraki adım</label>
              <input
                type="text"
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                disabled={!canManage}
                placeholder="Website inceleme ve ilk iletişim bilgisi araştırması"
                className={inputCls}
              />
            </div>

            {/* NOTLAR */}
            <div className="space-y-1.5">
              <label className={labelCls}>Notlar</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!canManage}
                className={cn(inputCls, 'resize-y min-h-24')}
              />
            </div>

            {!canManage && (
              <div className="px-4 py-3 bg-amber-bg/50 border border-amber-border/30 rounded-xl text-[12px] text-amber-text">
                Bu kayıt başka bir kullanıcıya atanmış. Düzenlemek için sorumlu olmanız veya yönetici olmanız gerekir.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between bg-white">
            {!isCreate && canManage && onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="text-[13px] font-semibold text-red-text hover:underline"
              >
                Sil
              </button>
            ) : <span />}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-[13px] font-semibold text-text-2 hover:bg-surface-2 rounded-lg transition-all"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canManage}
                className="px-5 py-2.5 bg-purple-text text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Kaydet
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

interface ContactSectionProps {
  titleLabel: string;
  value: DistributorContact;
  onChange: (next: DistributorContact) => void;
  disabled: boolean;
}

const ContactSection: React.FC<ContactSectionProps> = ({ titleLabel, value, onChange, disabled }) => (
  <div className={sectionCls}>
    <div className={labelCls}>{titleLabel}</div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <input
        type="text"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        disabled={disabled}
        placeholder="Ad Soyad"
        className={inputCls}
      />
      <input
        type="text"
        value={value.title}
        onChange={(e) => onChange({ ...value, title: e.target.value })}
        disabled={disabled}
        placeholder="Ünvan"
        className={inputCls}
      />
      <input
        type="email"
        value={value.email}
        onChange={(e) => onChange({ ...value, email: e.target.value })}
        disabled={disabled}
        placeholder="E-posta"
        className={inputCls}
      />
      <input
        type="tel"
        value={value.phone}
        onChange={(e) => onChange({ ...value, phone: e.target.value })}
        disabled={disabled}
        placeholder="Telefon"
        className={inputCls}
      />
    </div>
  </div>
);
