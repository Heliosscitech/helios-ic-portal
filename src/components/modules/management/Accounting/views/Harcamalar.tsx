import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Trash2, Edit3, ChevronDown, AlertTriangle } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { formatMoney } from '../../../../../lib/currency';
import { formatTR } from '../../../../../lib/dates';
import { confirmAction } from '../../../../../lib/confirm';
import { useMuhasebe } from '../context/MuhasebeContext';
import { PROGRAMS } from '../constants';
import { recAmt, recAmtEx, recTitle } from '../utils';
import type { Project, MuhasebeRecord } from '../types';

type Props = { project: Project; onEdit: (r: MuhasebeRecord) => void };

export const Harcamalar: React.FC<Props> = ({ project: p, onEdit }) => {
  const { usdRate, deleteExpense, bulkDeleteExpenses, projects } = useMuhasebe();
  const prog = PROGRAMS[p.program];

  const [search,    setSearch]    = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [sortBy,    setSortBy]    = useState('tarih-desc');
  const [selected,  setSelected]  = useState(new Set<string>());
  const [bulkMode,  setBulkMode]  = useState(false);

  // belgeNo → other project names that have the same belgeNo
  const duplicateMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const proj of projects) {
      if (proj.id === p.id) continue;
      for (const rec of proj.records) {
        if (!rec.belgeNo) continue;
        if (!map.has(rec.belgeNo)) map.set(rec.belgeNo, []);
        if (!map.get(rec.belgeNo)!.includes(proj.name)) map.get(rec.belgeNo)!.push(proj.name);
      }
    }
    return map;
  }, [projects, p.id]);

  const filtered = useMemo(() => {
    return p.records
      .filter(r => {
        if (filterCat !== 'all' && r.kategori !== filterCat) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            recTitle(r).toLowerCase().includes(q) ||
            r.belgeNo.toLowerCase().includes(q) ||
            (r.firma ?? '').toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'tarih-desc') return b.tarih.localeCompare(a.tarih);
        if (sortBy === 'tarih-asc')  return a.tarih.localeCompare(b.tarih);
        if (sortBy === 'tutar-desc') return recAmt(b, usdRate) - recAmt(a, usdRate);
        return recAmt(a, usdRate) - recAmt(b, usdRate);
      });
  }, [p.records, filterCat, search, sortBy, usdRate]);

  const toggleAll = () => {
    if (selected.size === filtered.length && filtered.length > 0) setSelected(new Set());
    else setSelected(new Set(filtered.map(r => r.id)));
  };

  const toggleOne = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleDelete = async (r: MuhasebeRecord, ev: React.MouseEvent) => {
    ev.stopPropagation();
    const ok = await confirmAction({ title: 'Harcamayı sil?', message: 'Bu kayıt kalıcı olarak silinecek.', confirmText: 'Sil', variant: 'danger' });
    if (ok) deleteExpense(p.id, r.id);
  };

  const handleBulkDelete = async () => {
    const ok = await confirmAction({ title: `${selected.size} harcamayı sil?`, message: 'Seçilen kayıtlar kalıcı olarak silinecek.', confirmText: 'Hepsini Sil', variant: 'danger' });
    if (ok) { bulkDeleteExpenses(p.id, selected); setSelected(new Set()); setBulkMode(false); }
  };

  const pageTotal  = filtered.reduce((s, r) => s + recAmt(r, usdRate), 0);
  const pageTotalN = filtered.reduce((s, r) => s + recAmtEx(r, usdRate), 0);

  const selectCls = 'px-3 py-2.5 text-[13px] bg-white border border-border rounded-lg text-text outline-none focus:border-info-border transition-colors';

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white border border-border rounded-2xl shadow-sm p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Harcama adı, belge no veya firma ara…"
            className="w-full pl-8 pr-3 py-2.5 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-info-border transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={13} className="text-text-3" />
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className={selectCls}>
            <option value="all">Tüm Kategoriler</option>
            {prog.categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <ChevronDown size={13} className="text-text-3" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectCls}>
            <option value="tarih-desc">Tarih (Azalan)</option>
            <option value="tarih-asc">Tarih (Artan)</option>
            <option value="tutar-desc">Tutar (Azalan)</option>
            <option value="tutar-asc">Tutar (Artan)</option>
          </select>
        </div>

        <button
          onClick={() => setBulkMode(v => !v)}
          className={cn('px-3 py-2.5 rounded-xl text-[13px] font-semibold border transition-all', bulkMode ? 'bg-surface-2 border-border text-text' : 'border-border text-text-2 hover:bg-surface-2')}
        >
          Çoklu Seç
        </button>

      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {bulkMode && selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-[#1a1a19] text-white rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-[14px] font-black">{selected.size}</div>
              <span className="text-[14px] font-bold">Kayıt seçildi</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelected(new Set())} className="px-3 py-2 bg-white/10 rounded-lg text-[12px] font-semibold hover:bg-white/20 transition-colors">Vazgeç</button>
              <button onClick={handleBulkDelete} className="px-3 py-2 bg-red-500 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 hover:bg-red-600 transition-colors"><Trash2 size={12} /> Seçilenleri Sil</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="bg-surface-2/40 border border-dashed border-border rounded-2xl m-4 p-10 text-center">
            <p className="text-[13px] text-text-3">{p.records.length === 0 ? 'Henüz harcama yok.' : 'Filtreye uyan kayıt yok.'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]" style={{ minWidth: 900 }}>
                <thead className="bg-surface-2 text-text-3">
                  <tr>
                    {bulkMode && (
                      <th className="px-4 py-3 w-10">
                        <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="cursor-pointer" />
                      </th>
                    )}
                    <Th>Kategori</Th>
                    <Th>Tarih / Belge</Th>
                    <Th>Harcama Detayı</Th>
                    <Th align="right">KDV Hariç</Th>
                    <Th align="right">KDV Dahil</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const cat      = prog.categories.find(c => c.id === r.kategori);
                    const isSelect = selected.has(r.id);

                    return (
                      <tr
                        key={r.id}
                        onClick={bulkMode ? () => toggleOne(r.id) : undefined}
                        className={cn(
                          'border-t border-border/30 transition-colors group',
                          bulkMode && 'cursor-pointer',
                          isSelect ? 'bg-surface-2/60' : 'hover:bg-surface-2/40',
                        )}
                      >
                        {bulkMode && (
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={isSelect} onChange={() => toggleOne(r.id)} onClick={e => e.stopPropagation()} className="cursor-pointer" />
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{cat?.icon ?? '📋'}</span>
                            <div>
                              <div className="text-[12px] font-bold text-text-2">{cat?.label ?? r.kategori}</div>
                              <div className="text-[10px] font-mono text-text-3">{cat?.formCode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-[13px] font-bold text-text tabular-nums">{formatTR(r.tarih)}</div>
                          <div className="text-[11px] text-text-3 font-mono mt-0.5">{r.belgeNo || '—'}</div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[14px] font-bold text-text truncate">{recTitle(r)}</span>
                            {r.yurtdisiAlimi === 'evet' && (
                              <span className="text-[9px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded uppercase tracking-wide">İthal</span>
                            )}
                            {r.paraBirimi === 'USD' && (
                              <span className="text-[9px] font-bold bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded">USD</span>
                            )}
                            {r.belgeNo && duplicateMap.has(r.belgeNo) && (
                              <span
                                title={`Aynı belge başka projede de mevcut: ${duplicateMap.get(r.belgeNo)!.join(', ')}`}
                                className="flex items-center gap-0.5 text-[9px] font-bold bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded uppercase tracking-wide cursor-default"
                              >
                                <AlertTriangle size={9} /> Tekrar
                              </span>
                            )}
                          </div>
                          {r.firma && <div className="text-[11px] text-text-3 mt-0.5 truncate">{r.firma}</div>}
                        </td>
                        <td className="px-4 py-3 text-right text-[13px] text-text-3 tabular-nums whitespace-nowrap">
                          {formatMoney(recAmtEx(r, usdRate), 'TRY')}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-[15px] text-text tabular-nums whitespace-nowrap">
                          {formatMoney(recAmt(r, usdRate), 'TRY')}
                        </td>
                        <td className="px-4 py-3 w-16">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(ev) => { ev.stopPropagation(); onEdit(r); }} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-3 hover:text-text transition-colors">
                              <Edit3 size={12} />
                            </button>
                            <button onClick={(ev) => handleDelete(r, ev)} className="p-1.5 rounded-lg hover:bg-red-50 text-text-3 hover:text-red-500 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-surface-2">
                  <tr>
                    <td colSpan={bulkMode ? 4 : 3} className="px-4 py-4 text-right text-[11px] font-black text-text-3 uppercase tracking-wider">
                      {filtered.length < p.records.length ? `${filtered.length} / ${p.records.length} kayıt` : `${p.records.length} kayıt`} — Sayfa Toplamı
                    </td>
                    <td className="px-4 py-4 text-right text-[14px] font-bold text-text-2 tabular-nums whitespace-nowrap">{formatMoney(pageTotalN, 'TRY')}</td>
                    <td className="px-4 py-4 text-right text-[18px] font-black text-text tabular-nums whitespace-nowrap">{formatMoney(pageTotal, 'TRY')}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Th: React.FC<{ children?: React.ReactNode; align?: 'left' | 'right' }> = ({ children, align = 'left' }) => (
  <th className={cn('px-4 py-3 text-[10px] font-bold uppercase tracking-widest', align === 'right' && 'text-right')}>
    {children}
  </th>
);
