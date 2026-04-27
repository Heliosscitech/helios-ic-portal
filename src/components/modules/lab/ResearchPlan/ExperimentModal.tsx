import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { todayISO } from './utils';
import { DEFAULT_DEVICES } from './constants';
import type { Experiment } from './types';
import type { User } from '../../../../types/portal';

interface Props {
  mode: 'create' | 'edit';
  experiment?: Experiment;
  users: User[];
  devices: string[];
  currentUserId: string;
  onAddDevice: (name: string) => void;
  onSave: (input: Partial<Experiment>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const labelCls = 'text-[11px] font-semibold uppercase tracking-widest text-text-3';
const inputCls =
  'w-full p-2.5 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors';

export const ExperimentModal: React.FC<Props> = ({
  mode,
  experiment,
  users,
  devices,
  currentUserId,
  onAddDevice,
  onSave,
  onDelete,
  onClose,
}) => {
  const isCreate = mode === 'create';
  const [code, setCode] = useState(experiment?.code ?? '');
  const [mof, setMof] = useState(experiment?.mof ?? '');
  const [name, setName] = useState(experiment?.name ?? '');
  const [nameError, setNameError] = useState(false);
  const [purpose, setPurpose] = useState(experiment?.purpose ?? '');
  const [ownerId, setOwnerId] = useState(experiment?.ownerId ?? currentUserId);
  const [device, setDevice] = useState(experiment?.device ?? devices[0] ?? DEFAULT_DEVICES[0]);
  const [startDate, setStartDate] = useState(experiment?.startDate ?? todayISO());
  const [endDate, setEndDate] = useState(experiment?.endDate ?? todayISO());
  const [synthesisAmount, setSynthesisAmount] = useState(experiment?.synthesisAmount ?? '');
  const [workupAmount, setWorkupAmount] = useState(experiment?.workupAmount ?? '');
  const [elnLink, setElnLink] = useState(experiment?.elnLink ?? '');

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const handleDeviceChange = (value: string) => {
    if (value === '__new__') {
      const next = window.prompt('Yeni cihaz adı:');
      if (next?.trim()) {
        onAddDevice(next.trim());
        setDevice(next.trim());
      }
      return;
    }
    setDevice(value);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    onSave({
      code: code.trim(),
      mof: mof.trim(),
      name: name.trim(),
      purpose: purpose.trim(),
      ownerId,
      device,
      startDate,
      endDate,
      synthesisAmount: synthesisAmount.trim(),
      workupAmount: workupAmount.trim(),
      elnLink: elnLink.trim(),
    });
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
          className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-lg mt-12 mb-8 overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-white">
            <h3 className="text-[15px] font-semibold text-text">
              {isCreate ? 'Yeni deney' : 'Deneyi düzenle'}
            </h3>
            <button type="button" onClick={onClose} className="p-1.5 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto">
            {/* KOD + MOF */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>KOD</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Örn. CALF-20 HSM-2"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>MOF</label>
                <input
                  type="text"
                  value={mof}
                  onChange={(e) => setMof(e.target.value)}
                  placeholder="CALF-20"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Deney adı */}
            <div className="space-y-1.5">
              <label className={labelCls}>
                Deney adı <span className="text-red-text">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(false);
                }}
                placeholder="Ne yapılacak?"
                className={cn(inputCls, nameError && 'border-red-border')}
              />
              {nameError && (
                <p className="text-[11px] text-red-text">Deney adı zorunludur.</p>
              )}
            </div>

            {/* Amaç */}
            <div className="space-y-1.5">
              <label className={labelCls}>Amaç</label>
              <textarea
                rows={2}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Neden bu deney?"
                className={cn(inputCls, 'resize-y min-h-16')}
              />
            </div>

            {/* Kim + Cihaz */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Kim</label>
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className={inputCls}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Cihaz</label>
                <select
                  value={device}
                  onChange={(e) => handleDeviceChange(e.target.value)}
                  className={inputCls}
                >
                  {devices.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="__new__">+ Yeni cihaz...</option>
                </select>
              </div>
            </div>

            {/* Başlangıç + Bitiş */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Başlangıç</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Bitiş</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Sentez/Workup miktar */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Sentez (gram)</label>
                <input
                  type="text"
                  value={synthesisAmount}
                  onChange={(e) => setSynthesisAmount(e.target.value)}
                  placeholder="1g"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Work-up (gram)</label>
                <input
                  type="text"
                  value={workupAmount}
                  onChange={(e) => setWorkupAmount(e.target.value)}
                  placeholder="1g"
                  className={inputCls}
                />
              </div>
            </div>

            {/* ELN / Confluence linki */}
            <div className="space-y-1.5">
              <label className={labelCls}>ELN / Confluence linki</label>
              <input
                type="url"
                value={elnLink}
                onChange={(e) => setElnLink(e.target.value)}
                placeholder="https://confluence.helios.com/.../deney-protokolu"
                className={inputCls}
              />
              <p className="text-[11px] text-text-3">
                Detaylı protokol veya defter linki — boş bırakılabilir.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between bg-white">
            {!isCreate && onDelete ? (
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
                onClick={handleSubmit}
                className="px-5 py-2.5 bg-purple-text text-white text-[13px] font-semibold rounded-lg hover:opacity-90 transition-all shadow-sm"
              >
                {isCreate ? 'Ekle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
