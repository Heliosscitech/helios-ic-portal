import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Sun, BarChart3, ChevronRight, X } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { formatMoney } from '../../../../../lib/currency';
import { confirmAction } from '../../../../../lib/confirm';
import { BreadcrumbHome } from '../../../../BreadcrumbHome';
import { useMuhasebe } from '../context/MuhasebeContext';
import { PROGRAMS, PROGRAM_STYLES } from '../constants';
import { recAmt } from '../utils';
import type { ProgramId, ProjectTab } from '../types';

type Props = { onSelectProject: (id: string, tab?: ProjectTab) => void };

const inputCls = 'w-full p-3 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-info-border transition-colors';
const labelCls = 'block text-[11px] font-bold text-text-3 uppercase tracking-wide mb-1.5';

export const ProjeListesi: React.FC<Props> = ({ onSelectProject }) => {
  const { projects, usdRate, addProject, deleteProject } = useMuhasebe();
  const [showNewForm, setShowNewForm] = useState(false);
  const [newProj, setNewProj] = useState<{ name: string; no: string; program: ProgramId; budget: string }>({
    name: '', no: '', program: 'tubitak_1501', budget: '',
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowNewForm(false); };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const genelProj  = projects.find(p => p.isGenel);
  const hibeProjs  = projects.filter(p => !p.isGenel);

  const genelKayit  = genelProj ? genelProj.records.length + genelProj.omRecords.length : 0;
  const genelToplam = genelProj ? genelProj.records.reduce((s, r) => s + recAmt(r, usdRate), 0) : 0;

  const handleCreate = () => {
    if (!newProj.name.trim()) return;
    addProject({ name: newProj.name, no: newProj.no, program: newProj.program, budget: parseFloat(newProj.budget) || 0 });
    setNewProj({ name: '', no: '', program: 'tubitak_1501', budget: '' });
    setShowNewForm(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirmAction({
      title: 'Projeyi sil?',
      message: `"${name}" projesi ve tüm verileri kalıcı olarak silinecek.`,
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (ok) deleteProject(id);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] text-text-3">
        <BreadcrumbHome />
        <span>/</span>
        <span className="font-semibold text-text">Proje Muhasebe</span>
      </div>

      {/* Hero */}
      <div className="bg-white border border-border rounded-2xl shadow-sm p-8 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center shrink-0">
          <BarChart3 size={28} className="text-text-2" />
        </div>
        <div>
          <h1 className="text-[22px] font-black text-text tracking-tight">Proje Muhasebe Sistemi</h1>
          <p className="text-[13px] text-text-3 mt-0.5">TÜBİTAK, KOSGEB, AB Horizon ve daha fazlası — tüm hibe projelerinizi tek yerden yönetin.</p>
        </div>
      </div>

      {/* 2 column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 items-start">

        {/* LEFT — Genel Muhasebe */}
        <div className="bg-white border border-border rounded-2xl shadow-sm p-6 flex flex-col gap-5">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl">
              <Sun size={28} />
            </div>
            <div>
              <h2 className="text-[17px] font-black text-text">Genel Muhasebe</h2>
              <p className="text-[12px] text-text-3 mt-0.5">Helios • Serbest kullanım, hızlı giriş</p>
            </div>
          </div>

          <div className="flex justify-center gap-8 py-3 border-y border-border/40">
            <div className="text-center">
              <div className="text-[22px] font-black text-text">{genelKayit}</div>
              <div className="text-[10px] font-bold text-text-3 uppercase tracking-wider mt-0.5">Kayıt</div>
            </div>
            <div className="w-px bg-border" />
            <div className="text-center">
              <div className="text-[18px] font-black text-text tabular-nums">{formatMoney(genelToplam, 'TRY')}</div>
              <div className="text-[10px] font-bold text-text-3 uppercase tracking-wider mt-0.5">Harcama</div>
            </div>
          </div>

          <button
            onClick={() => genelProj && onSelectProject(genelProj.id)}
            className="w-full bg-[#1a1a19] text-white py-3 rounded-xl text-[14px] font-bold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Genel Muhasebeye Gir <ChevronRight size={16} />
          </button>
        </div>

        {/* RIGHT — Hibe Projeleri */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-text-2" />
              <h2 className="text-[15px] font-bold text-text">Hibe Projeleri</h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-2 text-text-3 text-[11px] font-bold">{hibeProjs.length} proje</span>
            </div>
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-2 bg-[#1a1a19] text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus size={14} /> Yeni Proje
            </button>
          </div>

          <div className="space-y-3">
            {hibeProjs.map(p => {
              const prog   = PROGRAMS[p.program];
              const style  = PROGRAM_STYLES[p.program];
              const total  = p.records.reduce((s, r) => s + recAmt(r, usdRate), 0);

              return (
                <motion.div
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  whileHover={{ scale: 1.005 }}
                  className="bg-white border border-border rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="text-2xl shrink-0">{prog.icon}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide', style.bg, style.text)}>
                          {prog.shortName}
                        </span>
                        {p.no && <span className="text-[11px] text-text-3 font-mono">{p.no}</span>}
                      </div>
                      <h3 className="text-[14px] font-black text-text truncate">{p.name}</h3>
                      {p.budget > 0 && (() => {
                        const pct = Math.min(100, (total / p.budget) * 100);
                        const barCls = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-teal-600';
                        return (
                          <div className="mt-1.5">
                            <div className="flex justify-between text-[11px] text-text-3 mb-1">
                              <span className="tabular-nums font-semibold text-text-2">{formatMoney(total, 'TRY')}</span>
                              <span className="tabular-nums">/ {formatMoney(p.budget, 'TRY')} — %{pct.toFixed(0)}</span>
                            </div>
                            <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
                              <div className={cn('h-full rounded-full transition-all', barCls)} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(p.id, p.name); }}
                      className="p-2 rounded-lg text-text-3 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={16} className="text-text-3 group-hover:text-text transition-colors" />
                  </div>
                </motion.div>
              );
            })}

            {/* Dashed add button */}
            <button
              onClick={() => setShowNewForm(true)}
              className="w-full border-2 border-dashed border-border rounded-2xl p-5 flex items-center justify-center gap-2 text-[13px] text-text-3 font-semibold hover:bg-surface-2/50 hover:border-text-3/30 transition-all"
            >
              <Plus size={16} /> Yeni Hibe Projesi Oluştur
            </button>
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => setShowNewForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-lg mt-16 mb-8 overflow-hidden"
            >
              <div className="p-6 border-b border-border/40 flex items-center justify-between">
                <h2 className="text-[17px] font-black text-text">Yeni Hibe Projesi</h2>
                <button onClick={() => setShowNewForm(false)} className="w-8 h-8 rounded-lg hover:bg-surface-2 flex items-center justify-center text-text-3 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className={labelCls}>Program</label>
                  <select
                    value={newProj.program}
                    onChange={(e) => setNewProj({ ...newProj, program: e.target.value as ProgramId })}
                    className={inputCls}
                  >
                    {(Object.values(PROGRAMS) as typeof PROGRAMS[ProgramId][]).filter(p => p.id !== 'genel').map(p => (
                      <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Proje Adı <span className="text-red-500">*</span></label>
                  <input
                    placeholder="Ör: Akıllı Sensör Geliştirme Projesi"
                    value={newProj.name}
                    onChange={(e) => setNewProj({ ...newProj, name: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Proje No</label>
                    <input
                      placeholder="Ör: 123C075"
                      value={newProj.no}
                      onChange={(e) => setNewProj({ ...newProj, no: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Bütçe (₺)</label>
                    <input
                      type="number"
                      placeholder="Ör: 500000"
                      value={newProj.budget}
                      onChange={(e) => setNewProj({ ...newProj, budget: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 pt-0 flex gap-3 justify-end">
                <button
                  onClick={() => setShowNewForm(false)}
                  className="border border-border px-4 py-2.5 rounded-xl text-[13px] font-semibold text-text-2 hover:bg-surface-2 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newProj.name.trim()}
                  className="bg-[#1a1a19] text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all"
                >
                  Oluştur
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
