import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, ShieldAlert, BarChart3, Trash2, ActivitySquare, AlertTriangle } from 'lucide-react';
import { formatMoney } from '../../../../../lib/currency';
import { formatTR, todayISO } from '../../../../../lib/dates';

import { useMuhasebe } from '../context/MuhasebeContext';
import { PROGRAMS } from '../constants';
import { recAmt, recAmtEx, recTitle } from '../utils';
import type { Project } from '../types';

type Props = { project: Project; onDelete: () => void };

export const Raporlar: React.FC<Props> = ({ project: p, onDelete }) => {
  const { usdRate, deleteProject, projects } = useMuhasebe();
  const [confirmDel, setConfirmDel] = useState(false);
  const prog = PROGRAMS[p.program];

  // Records in this project whose belgeNo also appears in another project
  const duplicates = p.records
    .filter(r => r.belgeNo)
    .map(r => {
      const others = projects
        .filter(proj => proj.id !== p.id)
        .filter(proj => proj.records.some(rec => rec.belgeNo === r.belgeNo))
        .map(proj => proj.name);
      return others.length > 0 ? { record: r, otherProjects: others } : null;
    })
    .filter(Boolean) as { record: typeof p.records[0]; otherProjects: string[] }[];

  const totalGross = p.records.reduce((s, r) => s + recAmt(r, usdRate), 0);
  const totalNet   = p.records.reduce((s, r) => s + recAmtEx(r, usdRate), 0);
  const totalKDV   = totalGross - totalNet;
  const budget     = p.budget;
  const usedPct    = budget > 0 ? ((totalGross / budget) * 100).toFixed(2) : '0.00';

  const catTotals = prog.categories.map(c => {
    const recs  = p.records.filter(r => r.kategori === c.id);
    const total = recs.reduce((s, r) => s + recAmt(r, usdRate), 0);
    return { ...c, total, count: recs.length };
  }).filter(c => c.count > 0).sort((a, b) => b.total - a.total);

  const exportCSV = () => {
    const BOM = '﻿';
    const headers = ['Harcama Tarihi', 'Kategori', 'Form Kodu', 'Harcama Başlığı', 'Belge No', 'Belge Tarihi', 'Firma', 'KDV Hariç (TL)', 'KDV Dahil (TL)', 'Para Birimi', 'Yurtdışı'];
    const rows = p.records.map(r => {
      const cat = prog.categories.find(c => c.id === r.kategori);
      return [
        r.tarih, cat?.label ?? r.kategori, cat?.formCode ?? '-',
        recTitle(r), r.belgeNo, r.belgeTarih, r.firma ?? '',
        recAmtEx(r, usdRate).toFixed(2), recAmt(r, usdRate).toFixed(2),
        r.paraBirimi, r.yurtdisiAlimi === 'evet' ? 'Evet' : 'Hayır',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = BOM + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${p.name.replace(/\s+/g, '-')}-DETAYLI-RAPOR-${todayISO()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportTXT = () => {
    const topExp = [...p.records].sort((a, b) => recAmt(b, usdRate) - recAmt(a, usdRate)).slice(0, 5);
    const lines = [
      `======================================================`,
      `          HELİOS SCITECH — PROJE YÖNETİCİ ÖZETİ       `,
      `======================================================`,
      `PROJE ADI      : ${p.name.toUpperCase()}`,
      `PROJE NO       : ${p.no || 'BELİRTİLMEMİŞ'}`,
      `PROGRAM        : ${prog.name}`,
      `RAPOR TARİHİ   : ${formatTR(todayISO())}`,
      `DURUM          : ${totalGross > budget ? '!!! BÜTÇE AŞIMI !!!' : 'BÜTÇE DAHİLİNDE'}`,
      ``,
      `FİNANSAL ÖZET`,
      `------------------------------------------------------`,
      `TOPLAM HARCAMA (NET)   : ${formatMoney(totalNet, 'TRY')}`,
      `TOPLAM HARCAMA (BRÜT)  : ${formatMoney(totalGross, 'TRY')}`,
      `TOPLAM KDV YÜKÜ        : ${formatMoney(totalKDV, 'TRY')}`,
      `TOPLAM BÜTÇE           : ${budget > 0 ? formatMoney(budget, 'TRY') : 'BELİRTİLMEMİŞ'}`,
      `BÜTÇE KULLANIM ORANI   : %${usedPct}`,
      `KALAN BÜTÇE            : ${budget > 0 ? formatMoney(Math.max(0, budget - totalGross), 'TRY') : '—'}`,
      ``,
      `EN YÜKSEK 5 HARCAMA KALEMİ`,
      `------------------------------------------------------`,
      ...topExp.map((r, i) => `${i + 1}. [${formatTR(r.tarih)}] ${recTitle(r)} — ${formatMoney(recAmt(r, usdRate), 'TRY')}`),
      ``,
      `KATEGORİ BAZLI DAĞILIM`,
      `------------------------------------------------------`,
      ...prog.categories.map(c => {
        const recs  = p.records.filter(r => r.kategori === c.id);
        const total = recs.reduce((s, r) => s + recAmt(r, usdRate), 0);
        const share = totalGross > 0 ? ((total / totalGross) * 100).toFixed(1) : '0';
        return `${(c.label + ' (' + c.formCode + ')').padEnd(35)}: ${formatMoney(total, 'TRY').padEnd(16)} (%${share})`;
      }),
      ``,
      `------------------------------------------------------`,
      `BU RAPOR HELİOS OTOMASYON SİSTEMİ TARAFINDAN OLUŞTURULMUŞTUR.`,
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `ozet-${p.name.replace(/\s+/g, '-')}-${todayISO()}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleDelete = () => {
    deleteProject(p.id);
    onDelete();
  };

  return (
    <div className="space-y-5">
      {/* Export cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { onClick: exportCSV, icon: Download, title: 'Harcama CSV', desc: 'Tüm gider kalemlerini Excel uyumlu formatta indir.' },
          { onClick: exportTXT, icon: FileText, title: 'Yönetici Özeti (TXT)', desc: 'Projenin finansal durumunu özetleyen metin dosyası.' },
        ].map((c) => (
          <motion.button
            key={c.title}
            onClick={c.onClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="bg-white border border-border rounded-2xl shadow-sm p-8 flex flex-col items-center gap-4 text-center hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center">
              <c.icon size={26} className="text-text-2" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-text">{c.title}</h3>
              <p className="text-[12px] text-text-3 mt-1">{c.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Finansal performans */}
        <div className="bg-white border border-border rounded-2xl shadow-sm p-6">
          <h3 className="text-[14px] font-black text-text mb-5 flex items-center gap-2"><BarChart3 size={16} className="text-text-2" /> Finansal Performans</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Kalem Sayısı', value: String(p.records.length) },
              { label: 'Birim Maliyet', value: p.records.length > 0 ? formatMoney(totalGross / p.records.length, 'TRY') : '—' },
              { label: 'KDV Yükü', value: formatMoney(totalKDV, 'TRY') },
            ].map(s => (
              <div key={s.label} className="bg-surface-2/50 rounded-xl p-3 text-center">
                <div className="text-[11px] font-bold text-text-3 uppercase tracking-wider mb-1">{s.label}</div>
                <div className="text-[14px] font-black text-text tabular-nums">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category stats */}
        {catTotals.length > 0 && (
          <div className="bg-white border border-border rounded-2xl shadow-sm p-6">
            <h3 className="text-[14px] font-black text-text mb-5 flex items-center gap-2"><ActivitySquare size={16} className="text-text-2" /> Kategori Dağılımı</h3>
            <div className="space-y-2">
              {catTotals.slice(0, 4).map(c => {
                const pct = totalGross > 0 ? (c.total / totalGross) * 100 : 0;
                return (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="text-lg w-6 text-center">{c.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className="font-semibold text-text-2">{c.label}</span>
                        <span className="text-text-3">%{pct.toFixed(1)}</span>
                      </div>
                      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                        <div className="h-full bg-text-2/25 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-text-2 tabular-nums w-28 text-right">{formatMoney(c.total, 'TRY')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Duplicate expenses */}
      {duplicates.length > 0 && (
        <div className="bg-orange-50/60 border border-orange-200 rounded-2xl p-6">
          <h3 className="text-[14px] font-black text-orange-700 mb-1 flex items-center gap-2">
            <AlertTriangle size={15} /> Tekrarlanan Giderler ({duplicates.length})
          </h3>
          <p className="text-[12px] text-orange-600/80 mb-4">Aşağıdaki harcamaların belge numarası başka bir projede de kayıtlı. Mükerrer gider olup olmadığını kontrol edin.</p>
          <div className="space-y-2">
            {duplicates.map(({ record: r, otherProjects }) => (
              <div key={r.id} className="flex items-center justify-between gap-4 bg-white/70 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-text truncate">{recTitle(r)}</div>
                  <div className="text-[11px] text-text-3 mt-0.5 font-mono">{r.belgeNo} · {formatTR(r.tarih)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-black text-orange-700 tabular-nums">{formatMoney(recAmt(r, usdRate), 'TRY')}</div>
                  <div className="text-[10px] text-orange-500 mt-0.5 max-w-45 text-right truncate" title={otherProjects.join(', ')}>
                    ↔ {otherProjects.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6">
        <h3 className="text-[14px] font-black text-red-600 mb-2 flex items-center gap-2"><ShieldAlert size={16} /> Tehlikeli Bölge</h3>
        <p className="text-[13px] text-text-3 mb-5">Projeyi silmek, tüm harcama kayıtlarını ve muhasebe verilerini kalıcı olarak kaldıracaktır.</p>
        <AnimatePresence mode="wait">
          {!confirmDel ? (
            <motion.button key="b1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => setConfirmDel(true)}
              className="border border-red-400 text-red-500 px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-red-50 transition-colors"
            >
              Projeyi Sil
            </motion.button>
          ) : (
            <motion.div key="b2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-2">
              <button onClick={() => setConfirmDel(false)} className="border border-border px-4 py-2.5 rounded-xl text-[13px] font-semibold text-text-2 hover:bg-surface-2 transition-colors">İptal</button>
              <button onClick={handleDelete} className="bg-red-500 text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-red-600 flex items-center gap-1.5 transition-colors"><Trash2 size={13} /> Eminiz, Sil</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
