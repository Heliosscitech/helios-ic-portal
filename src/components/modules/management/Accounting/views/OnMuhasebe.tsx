import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Plus, Trash2, Edit3, Calendar, Tag } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { formatMoney } from '../../../../../lib/currency';
import { formatTR, todayISO } from '../../../../../lib/dates';
import { confirmAction } from '../../../../../lib/confirm';
import { useMuhasebe } from '../context/MuhasebeContext';
import { buildMonthlySummary, monthLabel } from '../utils';
import type { Project, LedgerEntry, LedgerFormData } from '../types';

type Props = { project: Project };

const inputCls = 'w-full p-3 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-info-border transition-colors';
const labelCls = 'block text-[10px] font-bold text-text-3 uppercase tracking-wide mb-1';

const defaultForm = (): LedgerFormData => ({
  tarih: todayISO(), tip: 'gelir', aciklama: '', tutar: 0, paraBirimi: 'TRY', hesap: '',
});

export const OnMuhasebe: React.FC<Props> = ({ project: p }) => {
  const { usdRate, addLedgerEntry, updateLedgerEntry, deleteLedgerEntry, bulkDeleteLedgerEntries } = useMuhasebe();

  const [form, setForm] = useState<LedgerFormData>(defaultForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [selected, setSelected] = useState(new Set<string>());
  const [tutarFocused, setTutarFocused] = useState(false);

  const gelir = p.omRecords.filter(e => e.tip === 'gelir').reduce((s, e) => s + (e.paraBirimi === 'USD' ? e.tutar * usdRate : e.tutar), 0);
  const gider = p.omRecords.filter(e => e.tip === 'gider').reduce((s, e) => s + (e.paraBirimi === 'USD' ? e.tutar * usdRate : e.tutar), 0);
  const net   = gelir - gider;

  const monthly = buildMonthlySummary(p.omRecords);

  const handleSave = () => {
    if (!form.aciklama.trim() || !form.tutar) return;
    if (editId) {
      updateLedgerEntry(editId, form);
      setEditId(null);
    } else {
      addLedgerEntry(p.id, form);
    }
    setForm(defaultForm());
  };

  const handleEdit = (e: LedgerEntry, ev: React.MouseEvent) => {
    ev.stopPropagation();
    setForm({ tarih: e.tarih, tip: e.tip, aciklama: e.aciklama, tutar: e.tutar, paraBirimi: e.paraBirimi, hesap: e.hesap ?? '' });
    setEditId(e.id);
  };

  const handleDelete = async (e: LedgerEntry, ev: React.MouseEvent) => {
    ev.stopPropagation();
    const ok = await confirmAction({ title: 'Kaydı sil?', message: 'Bu muhasebe kaydı kalıcı olarak silinecek.', confirmText: 'Sil', variant: 'danger' });
    if (ok) deleteLedgerEntry(p.id, e.id);
  };

  const handleBulkDelete = async () => {
    const ok = await confirmAction({ title: `${selected.size} kaydı sil?`, message: 'Seçilen kayıtlar kalıcı olarak silinecek.', confirmText: 'Hepsini Sil', variant: 'danger' });
    if (ok) { bulkDeleteLedgerEntries(p.id, selected); setSelected(new Set()); }
  };

  const toggleOne = (id: string) => setSelected(prev => {
    const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Toplam Gelir',  value: formatMoney(gelir, 'TRY'), icon: TrendingUp,   cls: 'text-teal-text bg-teal-bg' },
          { label: 'Toplam Gider',  value: formatMoney(gider, 'TRY'), icon: TrendingDown, cls: 'text-red-500 bg-red-50'    },
          { label: 'Net Bakiye',    value: formatMoney(net,   'TRY'), icon: Wallet,       cls: net >= 0 ? 'text-teal-text bg-teal-bg' : 'text-red-500 bg-red-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-border rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-text-3 uppercase tracking-wider">{s.label}</span>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', s.cls)}><s.icon size={16} /></div>
            </div>
            <div className="text-[20px] font-black text-text tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Monthly summary */}
      {monthly.length > 0 && (
        <div className="bg-white border border-border rounded-2xl shadow-sm p-6">
          <h3 className="text-[14px] font-black text-text mb-4">Aylık Özet</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-text-3 text-[10px] font-bold uppercase tracking-widest">
                  <th className="pb-3 text-left">Ay</th>
                  <th className="pb-3 text-right">Gelir (TRY)</th>
                  <th className="pb-3 text-right">Gelir (USD)</th>
                  <th className="pb-3 text-right">Gider (TRY)</th>
                  <th className="pb-3 text-right">Gider (USD)</th>
                  <th className="pb-3 text-right">Net</th>
                  <th className="pb-3 text-right">Kayıt</th>
                </tr>
              </thead>
              <tbody>
                {[...monthly].reverse().map(row => {
                  const netTRY = row.gelir_try + row.gelir_usd * usdRate - row.gider_try - row.gider_usd * usdRate;
                  return (
                    <tr key={row.month} className="border-t border-border/20">
                      <td className="py-3 font-semibold text-text-2 flex items-center gap-1.5"><Calendar size={12} className="text-text-3" />{monthLabel(row.month)}</td>
                      <td className="py-3 text-right tabular-nums text-teal-text font-semibold">{row.gelir_try > 0 ? formatMoney(row.gelir_try, 'TRY') : '—'}</td>
                      <td className="py-3 text-right tabular-nums text-teal-text font-semibold">{row.gelir_usd > 0 ? `$${row.gelir_usd.toLocaleString('tr-TR')}` : '—'}</td>
                      <td className="py-3 text-right tabular-nums text-red-500 font-semibold">{row.gider_try > 0 ? formatMoney(row.gider_try, 'TRY') : '—'}</td>
                      <td className="py-3 text-right tabular-nums text-red-500 font-semibold">{row.gider_usd > 0 ? `$${row.gider_usd.toLocaleString('tr-TR')}` : '—'}</td>
                      <td className={cn('py-3 text-right tabular-nums font-black', netTRY >= 0 ? 'text-teal-text' : 'text-red-500')}>{formatMoney(netTRY, 'TRY')}</td>
                      <td className="py-3 text-right text-text-3">{row.entry_count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2-column: form + list */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 items-start">

        {/* Form */}
        <div className="bg-white border border-border rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <Plus size={16} className="text-text-2" />
            <h3 className="text-[14px] font-black text-text">{editId ? 'Kaydı Düzenle' : 'İşlem Kaydı'}</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tip</label>
                <div className="flex gap-1 bg-surface-2 p-1 rounded-lg">
                  {(['gelir', 'gider'] as const).map(tip => (
                    <button
                      key={tip}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tip }))}
                      className={cn(
                        'flex-1 py-2 rounded-md text-[12px] font-bold uppercase transition-all',
                        form.tip === tip
                          ? tip === 'gelir' ? 'bg-teal-bg text-teal-text' : 'bg-red-50 text-red-500'
                          : 'text-text-3 hover:text-text-2',
                      )}
                    >
                      {tip}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Tarih</label>
                <input type="date" value={form.tarih} onChange={(e) => setForm(f => ({ ...f, tarih: e.target.value }))} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Açıklama <span className="text-red-500">*</span></label>
              <input
                placeholder="Ör: TÜBİTAK 1. Dönem Hibe Ödemesi"
                value={form.aciklama}
                onChange={(e) => setForm(f => ({ ...f, aciklama: e.target.value }))}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tutar</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 text-[13px] font-bold select-none">
                    {form.paraBirimi === 'USD' ? '$' : '₺'}
                  </span>
                  <input
                    type={tutarFocused ? 'number' : 'text'}
                    min="0"
                    step="any"
                    value={tutarFocused ? (form.tutar || '') : (form.tutar ? form.tutar.toLocaleString('tr-TR') : '')}
                    onChange={(e) => setForm(f => ({ ...f, tutar: parseFloat(e.target.value) || 0 }))}
                    onFocus={() => setTutarFocused(true)}
                    onBlur={() => setTutarFocused(false)}
                    placeholder="0,00"
                    className={cn(inputCls, 'pl-7 font-bold', form.tip === 'gelir' ? 'text-teal-text' : 'text-red-500')}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Para Birimi</label>
                <select value={form.paraBirimi} onChange={(e) => setForm(f => ({ ...f, paraBirimi: e.target.value as 'TRY' | 'USD' }))} className={inputCls}>
                  <option value="TRY">₺ TRY</option>
                  <option value="USD">$ USD</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Hesap / Banka</label>
              <input
                placeholder="Ör: İş Bankası Proje Hesabı"
                value={form.hesap ?? ''}
                onChange={(e) => setForm(f => ({ ...f, hesap: e.target.value }))}
                className={inputCls}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!form.aciklama.trim() || !form.tutar}
                className={cn(
                  'flex-1 py-3 rounded-xl text-[13px] font-bold transition-all active:scale-95 disabled:opacity-40',
                  editId ? 'bg-teal-bg text-teal-text border border-teal-text/20' : 'bg-[#1a1a19] text-white hover:opacity-90',
                )}
              >
                {editId ? 'Güncellemeyi Kaydet' : 'İşlemi Tamamla'}
              </button>
              {editId && (
                <button
                  onClick={() => { setEditId(null); setForm(defaultForm()); }}
                  className="px-4 py-3 rounded-xl border border-border text-[13px] font-semibold text-text-2 hover:bg-surface-2 transition-colors"
                >
                  Vazgeç
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Entry list */}
        <div className="bg-white border border-border rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-black text-text">Son Hareketler</h3>
            <AnimatePresence>
              {selected.size > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-[12px] font-bold"
                >
                  <Trash2 size={12} /> {selected.size} Sil
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            {p.omRecords.length === 0 ? (
              <div className="py-12 text-center text-[13px] text-text-3">Henüz işlem kaydı yok.</div>
            ) : (
              [...p.omRecords].reverse().map(e => {
                const isGelir = e.tip === 'gelir';
                const isSel   = selected.has(e.id);
                const tryAmt  = e.paraBirimi === 'USD' ? e.tutar * usdRate : e.tutar;
                return (
                  <div
                    key={e.id}
                    onClick={() => toggleOne(e.id)}
                    className={cn(
                      'flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all group',
                      isSel ? 'bg-surface-2 ring-1 ring-border' : 'bg-surface-2/40 hover:bg-surface-2',
                    )}
                  >
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', isGelir ? 'bg-teal-bg' : 'bg-red-50')}>
                      {isGelir ? <TrendingUp size={16} className="text-teal-text" /> : <TrendingDown size={16} className="text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-text truncate">{e.aciklama}</span>
                        {e.referansId && (
                          <span className="shrink-0 text-[9px] font-bold bg-surface-2 text-text-3 px-1.5 py-0.5 rounded uppercase tracking-wide">Proje Gideri</span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-3 flex items-center gap-2 mt-0.5">
                        <Calendar size={10} /> {formatTR(e.tarih)}
                        {e.hesap && <><Tag size={10} /> {e.hesap}</>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn('text-[15px] font-black tabular-nums', isGelir ? 'text-teal-text' : 'text-red-500')}>
                        {isGelir ? '+' : '−'}{formatMoney(tryAmt, 'TRY')}
                        {e.paraBirimi === 'USD' && <span className="text-[11px] ml-1 text-text-3">(${e.tutar.toLocaleString('tr-TR')})</span>}
                      </span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!e.referansId && (
                          <button onClick={(ev) => handleEdit(e, ev)} className="p-1.5 rounded hover:bg-white text-text-3 hover:text-text transition-colors"><Edit3 size={12} /></button>
                        )}
                        <button onClick={(ev) => handleDelete(e, ev)} className="p-1.5 rounded hover:bg-red-50 text-text-3 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
