import type { LedgerEntry, MuhasebeRecord, MonthlyRow } from './types';

export const genId = (): string =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

export const recAmt = (r: MuhasebeRecord, usdRate: number): number =>
  r.paraBirimi === 'USD' ? r.tutarKDVDahil * usdRate : r.tutarKDVDahil;

export const recAmtEx = (r: MuhasebeRecord, usdRate: number): number =>
  r.paraBirimi === 'USD' ? r.tutarKDVHaric * usdRate : r.tutarKDVHaric;

export const recTitle = (r: MuhasebeRecord): string =>
  r.malzemeAdi || r.aciklama || r.kategori;

export const buildMonthlySummary = (entries: LedgerEntry[]): MonthlyRow[] => {
  const map = new Map<string, MonthlyRow>();
  for (const e of entries) {
    const month = e.tarih.slice(0, 7);
    if (!map.has(month)) {
      map.set(month, { month, gelir_try: 0, gelir_usd: 0, gider_try: 0, gider_usd: 0, entry_count: 0 });
    }
    const row = map.get(month)!;
    row.entry_count++;
    if (e.tip === 'gelir') {
      if (e.paraBirimi === 'USD') row.gelir_usd += e.tutar;
      else row.gelir_try += e.tutar;
    } else {
      if (e.paraBirimi === 'USD') row.gider_usd += e.tutar;
      else row.gider_try += e.tutar;
    }
  }
  return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
};

export const monthLabel = (ym: string): string => {
  const [year, month] = ym.split('-');
  const TR_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${TR_MONTHS[parseInt(month) - 1]} ${year}`;
};
