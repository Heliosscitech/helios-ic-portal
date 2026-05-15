import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { todayISO } from '../../../../../lib/dates';
import { useMuhasebe } from '../context/MuhasebeContext';
import { PROGRAMS, KDV_ORANLARI, BIRIMLER } from '../constants';
import type { MuhasebeRecord } from '../types';

type Props = {
  projectId: string;
  record?: MuhasebeRecord | null;
  onClose: () => void;
  inline?: boolean;
};

const inputCls = 'w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-info-border transition-colors';
const labelCls = 'block text-[11px] font-bold text-text-3 uppercase tracking-wide mb-1.5';

type FormState = Omit<MuhasebeRecord, 'id' | 'projeId' | 'createdAt'>;

const defaultForm = (): FormState => ({
  kategori: 'malzeme',
  tarih: todayISO(),
  belgeNo: '',
  belgeTarih: todayISO(),
  tutarKDVHaric: 0,
  tutarKDVDahil: 0,
  kdvOrani: 20,
  paraBirimi: 'TRY',
  yurtdisiAlimi: 'hayir',
  notlar: '',
  malzemeAdi: '',
  aciklama: '',
  firma: '',
  birim: 'adet',
  miktar: 1,
  birimFiyat: 0,
});

export const GiderForm: React.FC<Props> = ({ projectId, record, onClose, inline = false }) => {
  const { projects, addExpense, updateExpense } = useMuhasebe();
  const project = projects.find(p => p.id === projectId)!;
  const prog    = PROGRAMS[project.program];

  const [form, setForm] = useState<FormState>(() =>
    record ? { ...record } : defaultForm()
  );
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onClose]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const recalcKDV = (hariç: number, oran: number) => {
    const dahil = hariç * (1 + oran / 100);
    setForm(prev => ({ ...prev, tutarKDVHaric: hariç, tutarKDVDahil: parseFloat(dahil.toFixed(2)), kdvOrani: oran }));
  };

  const handleMiktarBirimFiyat = (miktar: number, birimFiyat: number) => {
    const hariç = parseFloat((miktar * birimFiyat).toFixed(2));
    setForm(prev => ({ ...prev, miktar, birimFiyat, tutarKDVHaric: hariç, tutarKDVDahil: parseFloat((hariç * (1 + prev.kdvOrani / 100)).toFixed(2)) }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (record) {
      updateExpense(record.id, form);
    } else {
      addExpense(projectId, form);
    }
    setSuccess(true);
    setTimeout(() => { setSuccess(false); onClose(); }, 1200);
  };

  const cat = prog.categories.find(c => c.id === form.kategori) ?? prog.categories[0];
  const showMalzemeAdi = ['malzeme', 'alet', 'ekipman', 'makine', 'yazilim', 'equipment', 'consumables'].includes(form.kategori);
  const showMiktar     = showMalzemeAdi;
  const showFirma      = ['hizmet', 'arge_hizmet', 'subcontracting', 'hizmet_alimi', 'makine', 'yazilim', 'test', 'alet', 'equipment', 'malzeme'].includes(form.kategori);

  const formCard = (
    <div className="bg-white rounded-2xl shadow-sm border border-border w-full max-w-2xl overflow-hidden relative">
      {/* Success overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-teal-bg flex items-center justify-center">
              <CheckCircle2 size={36} className="text-teal-text" />
            </div>
            <p className="text-[16px] font-black text-text">Kaydedildi</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border/40">
        <div>
          <h2 className="text-[16px] font-black text-text">{record ? 'Harcama Düzenle' : 'Yeni Harcama'}</h2>
          <p className="text-[12px] text-text-3 mt-0.5">{project.name}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-surface-2 flex items-center justify-center text-text-3 transition-colors">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="p-5 space-y-5">

          {/* Category tabs */}
          <div>
            <label className={labelCls}>Kategori</label>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(prog.categories.length, 4)}, 1fr)` }}>
              {prog.categories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => set('kategori', c.id)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all',
                    form.kategori === c.id
                      ? 'bg-surface-2 border-text/20 text-text'
                      : 'bg-white border-border text-text-3 hover:bg-surface-2/50',
                  )}
                >
                  <span className="text-xl">{c.icon}</span>
                  <span className="text-[10px] font-bold leading-tight">{c.label}</span>
                  <span className="text-[9px] font-mono text-text-3">{c.formCode}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic top fields */}
          {showMalzemeAdi && (
            <div>
              <label className={labelCls}>{cat.id === 'alet' || cat.id === 'equipment' || cat.id === 'makine' || cat.id === 'yazilim' ? 'Ekipman / Alet Adı' : 'Malzeme Adı'} <span className="text-red-500">*</span></label>
              <input
                required
                placeholder="Ör: Arduino Mega, Spektroskopi Yazılımı..."
                value={form.malzemeAdi ?? ''}
                onChange={(e) => set('malzemeAdi', e.target.value)}
                className={inputCls}
              />
            </div>
          )}

          <div>
            <label className={labelCls}>Açıklama</label>
            <input
              placeholder="Ör: Proje kapsamında kullanım için..."
              value={form.aciklama ?? ''}
              onChange={(e) => set('aciklama', e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Miktar row */}
          {showMiktar && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Miktar</label>
                <input
                  type="number" min="0" step="any"
                  value={form.miktar ?? ''}
                  onChange={(e) => handleMiktarBirimFiyat(parseFloat(e.target.value) || 0, form.birimFiyat ?? 0)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Birim</label>
                <select value={form.birim ?? 'adet'} onChange={(e) => set('birim', e.target.value)} className={inputCls}>
                  {BIRIMLER.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Birim Fiyat ({form.paraBirimi})</label>
                <input
                  type="number" min="0" step="any" placeholder="0.00"
                  value={form.birimFiyat ?? ''}
                  onChange={(e) => handleMiktarBirimFiyat(form.miktar ?? 1, parseFloat(e.target.value) || 0)}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {/* Tarih + Belge row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Harcama Tarihi <span className="text-red-500">*</span></label>
              <input required type="date" value={form.tarih} onChange={(e) => set('tarih', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Belge No <span className="text-red-500">*</span></label>
              <input required value={form.belgeNo} onChange={(e) => set('belgeNo', e.target.value)} placeholder="FAT-001" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Belge Tarihi <span className="text-red-500">*</span></label>
              <input required type="date" value={form.belgeTarih} onChange={(e) => set('belgeTarih', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* KDV row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Tutar KDV Hariç ({form.paraBirimi})</label>
              <input
                type="number" min="0" step="any" placeholder="0.00"
                value={form.tutarKDVHaric || ''}
                onChange={(e) => recalcKDV(parseFloat(e.target.value) || 0, form.kdvOrani)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>KDV Oranı (%)</label>
              <select value={form.kdvOrani} onChange={(e) => recalcKDV(form.tutarKDVHaric, parseInt(e.target.value))} className={inputCls}>
                {KDV_ORANLARI.map(o => <option key={o} value={o}>%{o}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tutar KDV Dahil ({form.paraBirimi})</label>
              <input
                type="number" min="0" step="any" placeholder="0.00"
                value={form.tutarKDVDahil || ''}
                onChange={(e) => set('tutarKDVDahil', parseFloat(e.target.value) || 0)}
                className={cn(inputCls, 'font-bold')}
              />
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Para Birimi</label>
              <select value={form.paraBirimi} onChange={(e) => set('paraBirimi', e.target.value as 'TRY' | 'USD')} className={inputCls}>
                <option value="TRY">₺ TRY</option>
                <option value="USD">$ USD</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Yurtdışı Alımı</label>
              <select value={form.yurtdisiAlimi} onChange={(e) => set('yurtdisiAlimi', e.target.value as 'evet' | 'hayir')} className={inputCls}>
                <option value="hayir">Hayır</option>
                <option value="evet">Evet</option>
              </select>
            </div>
          </div>

          {showFirma && (
            <div>
              <label className={labelCls}>Firma / Tedarikçi</label>
              <input value={form.firma ?? ''} onChange={(e) => set('firma', e.target.value)} placeholder="Firma adı..." className={inputCls} />
            </div>
          )}

          <div>
            <label className={labelCls}>Notlar</label>
            <textarea
              rows={2}
              value={form.notlar}
              onChange={(e) => set('notlar', e.target.value)}
              className={cn(inputCls, 'resize-none')}
              placeholder="Varsa ek açıklamalar..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0 flex gap-3 justify-end border-t border-border/40">
          <button type="button" onClick={onClose} className="border border-border px-4 py-2.5 rounded-xl text-[13px] font-semibold text-text-2 hover:bg-surface-2 transition-colors">
            İptal
          </button>
          <button type="submit" className="bg-[#1a1a19] text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:opacity-90 active:scale-95 transition-all">
            {record ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );

  if (inline) return (
    <form onSubmit={handleSubmit} className="space-y-4 relative">
      {/* Success overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 z-50 flex flex-col items-center justify-center gap-3 pointer-events-none"
          >
            <div className="w-20 h-20 rounded-full bg-teal-bg flex items-center justify-center">
              <CheckCircle2 size={44} className="text-teal-text" />
            </div>
            <p className="text-[18px] font-black text-text">Kaydedildi</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header card */}
      <div className="bg-white border border-border rounded-2xl shadow-sm px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-black text-text">{record ? 'Harcama Düzenle' : 'Yeni Harcama'}</h2>
          <p className="text-[13px] text-text-3 mt-0.5">{project.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} className="border border-border px-5 py-2.5 rounded-xl text-[13px] font-semibold text-text-2 hover:bg-surface-2 transition-colors">
            İptal
          </button>
          <button type="submit" className="bg-[#1a1a19] text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:opacity-90 active:scale-95 transition-all">
            {record ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Category - full width */}
      <div className="bg-white border border-border rounded-2xl shadow-sm p-6">
        <label className={labelCls}>Kategori</label>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${prog.categories.length}, 1fr)` }}>
          {prog.categories.map(c => (
            <button
              key={c.id} type="button" onClick={() => set('kategori', c.id)}
              className={cn(
                'flex flex-col items-center gap-1.5 py-4 px-2 rounded-xl border text-center transition-all',
                form.kategori === c.id
                  ? 'bg-surface-2 border-text/20 text-text'
                  : 'bg-white border-border text-text-3 hover:bg-surface-2/50',
              )}
            >
              <span className="text-2xl">{c.icon}</span>
              <span className="text-[11px] font-bold leading-tight">{c.label}</span>
              <span className="text-[9px] font-mono text-text-3">{c.formCode}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: item details */}
        <div className="bg-white border border-border rounded-2xl shadow-sm p-6 space-y-5">
          <p className="text-[11px] font-black text-text-3 uppercase tracking-widest">Kalem Bilgileri</p>

          {showMalzemeAdi && (
            <div>
              <label className={labelCls}>{cat.id === 'alet' || cat.id === 'equipment' || cat.id === 'makine' || cat.id === 'yazilim' ? 'Ekipman / Alet Adı' : 'Malzeme Adı'} <span className="text-red-500">*</span></label>
              <input required placeholder="Ör: Arduino Mega, Spektroskopi Yazılımı..." value={form.malzemeAdi ?? ''} onChange={(e) => set('malzemeAdi', e.target.value)} className={inputCls} />
            </div>
          )}

          <div>
            <label className={labelCls}>Açıklama</label>
            <input placeholder="Ör: Proje kapsamında kullanım için..." value={form.aciklama ?? ''} onChange={(e) => set('aciklama', e.target.value)} className={inputCls} />
          </div>

          {showFirma && (
            <div>
              <label className={labelCls}>Firma / Tedarikçi</label>
              <input value={form.firma ?? ''} onChange={(e) => set('firma', e.target.value)} placeholder="Firma adı..." className={inputCls} />
            </div>
          )}

          <div>
            <label className={labelCls}>Notlar</label>
            <textarea rows={3} value={form.notlar} onChange={(e) => set('notlar', e.target.value)} className={cn(inputCls, 'resize-none')} placeholder="Varsa ek açıklamalar..." />
          </div>
        </div>

        {/* Right: financial details */}
        <div className="bg-white border border-border rounded-2xl shadow-sm p-6 space-y-5">
          <p className="text-[11px] font-black text-text-3 uppercase tracking-widest">Finansal Bilgiler</p>

          {/* Tarih + Belge */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Harcama Tarihi <span className="text-red-500">*</span></label>
              <input required type="date" value={form.tarih} onChange={(e) => set('tarih', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Belge No <span className="text-red-500">*</span></label>
              <input required value={form.belgeNo} onChange={(e) => set('belgeNo', e.target.value)} placeholder="FAT-001" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Belge Tarihi <span className="text-red-500">*</span></label>
              <input required type="date" value={form.belgeTarih} onChange={(e) => set('belgeTarih', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Miktar */}
          {showMiktar && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Miktar</label>
                <input type="number" min="0" step="any" value={form.miktar ?? ''} onChange={(e) => handleMiktarBirimFiyat(parseFloat(e.target.value) || 0, form.birimFiyat ?? 0)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Birim</label>
                <select value={form.birim ?? 'adet'} onChange={(e) => set('birim', e.target.value)} className={inputCls}>
                  {BIRIMLER.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Birim Fiyat ({form.paraBirimi})</label>
                <input type="number" min="0" step="any" placeholder="0.00" value={form.birimFiyat ?? ''} onChange={(e) => handleMiktarBirimFiyat(form.miktar ?? 1, parseFloat(e.target.value) || 0)} className={inputCls} />
              </div>
            </div>
          )}

          {/* KDV */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>KDV Hariç ({form.paraBirimi})</label>
              <input type="number" min="0" step="any" placeholder="0.00" value={form.tutarKDVHaric || ''} onChange={(e) => recalcKDV(parseFloat(e.target.value) || 0, form.kdvOrani)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>KDV Oranı</label>
              <select value={form.kdvOrani} onChange={(e) => recalcKDV(form.tutarKDVHaric, parseInt(e.target.value))} className={inputCls}>
                {KDV_ORANLARI.map(o => <option key={o} value={o}>%{o}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>KDV Dahil ({form.paraBirimi})</label>
              <input type="number" min="0" step="any" placeholder="0.00" value={form.tutarKDVDahil || ''} onChange={(e) => set('tutarKDVDahil', parseFloat(e.target.value) || 0)} className={cn(inputCls, 'font-bold')} />
            </div>
          </div>

          {/* Para birimi + Yurtdışı */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Para Birimi</label>
              <select value={form.paraBirimi} onChange={(e) => set('paraBirimi', e.target.value as 'TRY' | 'USD')} className={inputCls}>
                <option value="TRY">₺ TRY</option>
                <option value="USD">$ USD</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Yurtdışı Alımı</label>
              <select value={form.yurtdisiAlimi} onChange={(e) => set('yurtdisiAlimi', e.target.value as 'evet' | 'hayir')} className={inputCls}>
                <option value="hayir">Hayır</option>
                <option value="evet">Evet</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </form>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="mt-12 mb-8 w-full max-w-2xl"
        >
          {formCard}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
