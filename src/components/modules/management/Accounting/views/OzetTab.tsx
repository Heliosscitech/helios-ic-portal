import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, ReceiptText, AlertTriangle, Layers, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { formatMoney } from '../../../../../lib/currency';
import { formatTR } from '../../../../../lib/dates';
import { useMuhasebe } from '../context/MuhasebeContext';
import { PROGRAMS, PROGRAM_STYLES } from '../constants';
import { recAmt, recAmtEx } from '../utils';
import type { Project } from '../types';

type Props = { project: Project };

export const OzetTab: React.FC<Props> = ({ project: p }) => {
  const { usdRate, projects, deleteLedgerEntry } = useMuhasebe();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const prog = PROGRAMS[p.program];

  const hibeProjects = projects.filter(proj => !proj.isGenel);
  const genelProj = projects.find(proj => proj.isGenel);

  // Per-project spending for the Genel Muhasebe breakdown
  const projSpending = hibeProjects.map(proj => ({
    proj,
    total: proj.records.reduce((s, r) => s + recAmt(r, usdRate), 0),
  })).sort((a, b) => b.total - a.total);
  const maxProjTotal = Math.max(...projSpending.map(x => x.total), 1);

  // Cross-project duplicate detection: belgeNo → list of hits with mirrorId for Genel removal
  const dupGroups = (() => {
    const map = new Map<string, { projId: string; projName: string; recordId: string; mirrorId: string | null; tarih: string; title: string; tutar: number }[]>();
    for (const proj of hibeProjects) {
      for (const r of proj.records) {
        if (!r.belgeNo) continue;
        if (!map.has(r.belgeNo)) map.set(r.belgeNo, []);
        const mirrorId = genelProj?.omRecords.find(e => e.referansId === r.id)?.id ?? null;
        map.get(r.belgeNo)!.push({ projId: proj.id, projName: proj.name, recordId: r.id, mirrorId, tarih: r.tarih, title: r.malzemeAdi || r.aciklama || r.kategori, tutar: recAmt(r, usdRate) });
      }
    }
    return Array.from(map.entries()).filter(([, hits]) => hits.length > 1);
  })();

  // Consolidated totals for Genel Muhasebe from omRecords (includes all hibe mirrors)
  const omGelir = p.omRecords.filter(e => e.tip === 'gelir').reduce((s, e) => s + (e.paraBirimi === 'USD' ? e.tutar * usdRate : e.tutar), 0);
  const omGider = p.omRecords.filter(e => e.tip === 'gider').reduce((s, e) => s + (e.paraBirimi === 'USD' ? e.tutar * usdRate : e.tutar), 0);
  const omNet   = omGelir - omGider;

  const totalGross = p.records.reduce((s, r) => s + recAmt(r, usdRate), 0);
  const totalNet   = p.records.reduce((s, r) => s + recAmtEx(r, usdRate), 0);
  const totalKDV   = totalGross - totalNet;
  const budget     = p.budget;
  const remaining  = budget - totalGross;

  const catTotals = prog.categories.map(c => {
    const recs  = p.records.filter(r => r.kategori === c.id);
    const total = recs.reduce((s, r) => s + recAmt(r, usdRate), 0);
    return { ...c, total, count: recs.length };
  }).filter(c => c.count > 0).sort((a, b) => b.total - a.total);

  const maxCat = Math.max(...catTotals.map(c => c.total), 1);

  const stats = p.isGenel
    ? [
        { label: 'Toplam Ciro',    value: formatMoney(omGelir, 'TRY'), icon: TrendingUp,   color: 'text-teal-text bg-teal-bg' },
        { label: 'Toplam Harcama', value: formatMoney(omGider, 'TRY'), icon: TrendingDown,  color: 'text-red-500 bg-red-50' },
        { label: 'Net Bakiye',     value: formatMoney(omNet,   'TRY'), icon: Wallet,        color: omNet >= 0 ? 'text-teal-text bg-teal-bg' : 'text-red-500 bg-red-50' },
      ]
    : [
        { label: 'Toplam Harcama (Brüt)', value: formatMoney(totalGross, 'TRY'), icon: TrendingDown, color: 'text-red-500 bg-red-50' },
        { label: 'Toplam Harcama (Net)',  value: formatMoney(totalNet,   'TRY'), icon: ReceiptText,  color: 'text-text-2 bg-surface-2' },
        { label: 'Toplam KDV',            value: formatMoney(totalKDV,   'TRY'), icon: TrendingUp,   color: 'text-amber-600 bg-amber-50' },
        ...(budget > 0 ? [{ label: 'Kalan Bütçe', value: formatMoney(Math.max(0, remaining), 'TRY'), icon: Wallet, color: remaining >= 0 ? 'text-teal-text bg-teal-bg' : 'text-red-500 bg-red-50' }] : []),
      ];

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className={cn('grid gap-4', p.isGenel ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4')}>
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-border rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-text-3 uppercase tracking-wider">{s.label}</span>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', s.color)}>
                <s.icon size={16} />
              </div>
            </div>
            <div className="text-[20px] font-black text-text tabular-nums leading-tight">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      {catTotals.length > 0 && (
        <div className="bg-white border border-border rounded-2xl shadow-sm p-6">
          <h3 className="text-[14px] font-black text-text mb-5">Kategori Bazlı Dağılım</h3>
          <div className="space-y-4">
            {catTotals.map(c => {
              const pct = totalGross > 0 ? (c.total / totalGross) * 100 : 0;
              const barW = maxCat > 0 ? (c.total / maxCat) * 100 : 0;
              return (
                <div key={c.id} className="flex items-center gap-4">
                  <div className="w-7 text-center text-lg shrink-0">{c.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-text truncate">{c.label}</span>
                        <span className="text-[10px] font-mono text-text-3">{c.formCode}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-text-3">{c.count} kayıt</span>
                        <span className="text-[13px] font-bold text-text-2 tabular-nums">{formatMoney(c.total, 'TRY')}</span>
                        <span className="text-[11px] text-text-3 w-10 text-right">%{pct.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-text-2/30 rounded-full transition-all duration-500"
                        style={{ width: `${barW}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {p.records.length === 0 && !p.isGenel && (
        <div className="bg-surface-2/40 border border-dashed border-border rounded-2xl p-12 text-center">
          <p className="text-[13px] text-text-3">Henüz harcama kaydı yok. Harcamalar sekmesinden ekleyin.</p>
        </div>
      )}

      {/* Genel Muhasebe: per-project spending breakdown */}
      {p.isGenel && hibeProjects.length > 0 && (
        <div className="bg-white border border-border rounded-2xl shadow-sm p-6">
          <h3 className="text-[14px] font-black text-text mb-5 flex items-center gap-2">
            <Layers size={15} className="text-text-2" /> Hibe Projesi Gider Özeti
          </h3>
          <div className="space-y-4">
            {projSpending.map(({ proj, total }) => {
              const style = PROGRAM_STYLES[proj.program];
              const prog2 = PROGRAMS[proj.program];
              const barW  = maxProjTotal > 0 ? (total / maxProjTotal) * 100 : 0;
              return (
                <div key={proj.id} className="flex items-center gap-4">
                  <span className="text-lg w-7 text-center shrink-0">{prog2.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0', style.bg, style.text)}>{prog2.shortName}</span>
                        <span className="text-[13px] font-bold text-text truncate">{proj.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-[11px] text-text-3">{proj.records.length} kalem</span>
                        <span className="text-[13px] font-bold text-text-2 tabular-nums">{formatMoney(total, 'TRY')}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                      <div className="h-full bg-text-2/30 rounded-full transition-all duration-500" style={{ width: `${barW}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Genel Muhasebe: interactive cross-project duplicate warnings */}
      {p.isGenel && dupGroups.length > 0 && (
        <div className="bg-orange-50/60 border border-orange-200 rounded-2xl p-6">
          <h3 className="text-[14px] font-black text-orange-700 mb-1 flex items-center gap-2">
            <AlertTriangle size={15} /> Mükerrer Giderler ({dupGroups.length})
          </h3>
          <p className="text-[12px] text-orange-600/80 mb-4">Aynı belge numarasıyla birden fazla projede kayıt bulunuyor. Tıklayarak detayları görün veya silme yapın.</p>
          <div className="space-y-2">
            {dupGroups.map(([belgeNo, hits]) => {
              const isOpen = expandedGroup === belgeNo;
              return (
                <div key={belgeNo} className="bg-white/70 border border-orange-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedGroup(isOpen ? null : belgeNo)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-orange-50/50 transition-colors"
                  >
                    {isOpen ? <ChevronDown size={14} className="text-orange-500 shrink-0" /> : <ChevronRight size={14} className="text-orange-500 shrink-0" />}
                    <span className="text-[11px] font-mono font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded shrink-0">{belgeNo}</span>
                    <span className="text-[12px] text-text-2 font-semibold truncate flex-1">{hits[0].title}</span>
                    <span className="text-[11px] text-orange-600 font-bold shrink-0">{hits.length} proje</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-orange-100 divide-y divide-orange-50">
                      {hits.map((hit) => (
                        <div key={hit.recordId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <span className="text-[12px] text-text-2 font-semibold truncate flex-1">{hit.projName}</span>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[11px] text-text-3">{formatTR(hit.tarih)}</span>
                            <span className="text-[12px] font-black text-orange-700 tabular-nums">{formatMoney(hit.tutar, 'TRY')}</span>
                            {hit.mirrorId && (
                              <button
                                onClick={() => deleteLedgerEntry('genel', hit.mirrorId!)}
                                title="Genel Muhasebe'den çıkar (hibe projesindeki kayıt kalır)"
                                className="p-1 text-text-3 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
