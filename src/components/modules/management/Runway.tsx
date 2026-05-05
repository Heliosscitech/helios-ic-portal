import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Calendar, Flame, TrendingDown, TrendingUp, Wallet,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { cn } from '../../../lib/utils';
import { TR_MONTHS_LONG, TR_MONTHS_SHORT } from '../../../lib/dates';
import { formatMoney, formatMoneyCompact, isTRY } from '../../../lib/currency';
import { isExpense, isIncome } from '../../../lib/ledger';
import {
  ErrorBlock, LoadingBlock, PageHeader, StatCard,
} from '../../external-mirror/shared';
import { triggerExternalSync } from '../../../lib/external-sync';

type LedgerEntry = {
  id: string;
  tarih: string;
  tip: string;
  tutar: number;
  para_birimi: string | null;
  kategori: string | null;
  aciklama: string | null;
  synced_at: string;
};

type ProjectExpense = {
  id: string;
  project_id: string | null;
  tarih: string;
  kategori: string | null;
  tutar_kdv_dahil: number | null;
  para_birimi: string | null;
};

type Project = {
  id: string;
  name: string;
  no: string | null;
  program: string;
};

type MonthBucket = {
  key: string;
  year: number;
  month: number;
  label: string;
  gelir: number;
  gider: number;
};

const monthKey = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth() };
};

const bucketKey = (year: number, month: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}`;

// Generate sequential month buckets from start to end (inclusive), zero-filled
const generateMonths = (startY: number, startM: number, endY: number, endM: number): MonthBucket[] => {
  const out: MonthBucket[] = [];
  let y = startY;
  let m = startM;
  while (y < endY || (y === endY && m <= endM)) {
    out.push({
      key: bucketKey(y, m),
      year: y,
      month: m,
      label: `${TR_MONTHS_SHORT[m]} '${String(y).slice(-2)}`,
      gelir: 0,
      gider: 0,
    });
    m += 1;
    if (m > 11) { m = 0; y += 1; }
  }
  return out;
};

const RUNWAY_WINDOW_MONTHS = 3; // ortalamayı son 3 aydan al

export const Runway: React.FC = () => {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>([]);
  const [projects, setProjects] = useState<Map<string, Project>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    const [ledgerRes, expRes, projRes] = await Promise.all([
      supabase
        .from('external_accounting_ledger')
        .select('id, tarih, tip, tutar, para_birimi, kategori, aciklama, synced_at')
        .order('tarih', { ascending: true }),
      supabase
        .from('external_project_expenses')
        .select('id, project_id, tarih, kategori, tutar_kdv_dahil, para_birimi'),
      supabase.from('external_projects').select('id, name, no, program'),
    ]);
    if (ledgerRes.error) {
      setError(ledgerRes.error.message);
      setLoading(false);
      return;
    }
    setLedger((ledgerRes.data ?? []) as LedgerEntry[]);
    setProjectExpenses((expRes.data ?? []) as ProjectExpense[]);
    const pmap = new Map<string, Project>();
    for (const p of (projRes.data ?? []) as Project[]) pmap.set(p.id, p);
    setProjects(pmap);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await triggerExternalSync();
    await fetchAll();
    setRefreshing(false);
  };

  // Monthly buckets — TRY only, zero-filled to current month
  const months = useMemo<MonthBucket[]>(() => {
    const tryEntries = ledger.filter((e) => isTRY(e.para_birimi));
    if (tryEntries.length === 0) return [];

    let first: { year: number; month: number } | null = null;
    for (const e of tryEntries) {
      const mk = monthKey(e.tarih);
      if (!mk) continue;
      if (!first || mk.year * 12 + mk.month < first.year * 12 + first.month) {
        first = mk;
      }
    }
    if (!first) return [];

    const now = new Date();
    const buckets = generateMonths(first.year, first.month, now.getFullYear(), now.getMonth());
    const byKey = new Map<string, MonthBucket>();
    for (const b of buckets) byKey.set(b.key, b);

    for (const e of tryEntries) {
      const mk = monthKey(e.tarih);
      if (!mk) continue;
      const b = byKey.get(bucketKey(mk.year, mk.month));
      if (!b) continue;
      if (isIncome(e.tip)) b.gelir += e.tutar;
      else if (isExpense(e.tip)) b.gider += e.tutar;
    }
    return buckets;
  }, [ledger]);

  // Cumulative cash = sum of all (gelir - gider) up to and including current month
  const currentCash = useMemo(() => {
    let cash = 0;
    for (const m of months) cash += m.gelir - m.gider;
    return cash;
  }, [months]);

  // Average monthly burn (last RUNWAY_WINDOW_MONTHS, EXCLUDING current month if it's incomplete)
  const burn = useMemo(() => {
    if (months.length === 0) return { avg: 0, window: 0 };
    // Exclude current month (last bucket) if it's still in progress
    const now = new Date();
    const completedMonths = months.filter((m) => !(m.year === now.getFullYear() && m.month === now.getMonth()));
    const sample = completedMonths.slice(-RUNWAY_WINDOW_MONTHS);
    if (sample.length === 0) {
      // Use current month if no completed history
      const last = months[months.length - 1];
      return { avg: last.gider, window: 1 };
    }
    const total = sample.reduce((s, m) => s + m.gider, 0);
    return { avg: total / sample.length, window: sample.length };
  }, [months]);

  // Runway months at current burn rate
  const runwayMonths = useMemo(() => {
    if (burn.avg <= 0) return Infinity;
    if (currentCash <= 0) return 0;
    return currentCash / burn.avg;
  }, [currentCash, burn]);

  const runwayEndDate = useMemo(() => {
    if (!Number.isFinite(runwayMonths) || runwayMonths <= 0) return null;
    const now = new Date();
    const totalMs = runwayMonths * 30.44 * 24 * 60 * 60 * 1000; // avg month
    return new Date(now.getTime() + totalMs);
  }, [runwayMonths]);

  // Expense category breakdown — last 3 months (window)
  const categoryBreakdown = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - RUNWAY_WINDOW_MONTHS, 1);
    const map = new Map<string, number>();
    for (const e of ledger) {
      if (!isTRY(e.para_birimi)) continue;
      if (!isExpense(e.tip)) continue;
      const d = new Date(e.tarih);
      if (Number.isNaN(d.getTime()) || d < cutoff) continue;
      const cat = e.kategori ?? 'Kategorisiz';
      map.set(cat, (map.get(cat) ?? 0) + e.tutar);
    }
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .map(([cat, amt]) => ({ cat, amt, pct: total > 0 ? (amt / total) * 100 : 0 }))
      .sort((a, b) => b.amt - a.amt);
  }, [ledger]);

  // Top projects by spend (project_expenses)
  const topProjects = useMemo(() => {
    const map = new Map<string, number>();
    for (const pe of projectExpenses) {
      if (!isTRY(pe.para_birimi)) continue;
      const amt = pe.tutar_kdv_dahil ?? 0;
      if (amt <= 0) continue;
      const key = pe.project_id ?? 'unassigned';
      map.set(key, (map.get(key) ?? 0) + amt);
    }
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .map(([id, amt]) => ({
        id,
        name: id === 'unassigned' ? 'Atanmamış' : projects.get(id)?.name ?? 'Bilinmiyor',
        no: id === 'unassigned' ? null : projects.get(id)?.no ?? null,
        amt,
        pct: total > 0 ? (amt / total) * 100 : 0,
      }))
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 5);
  }, [projectExpenses, projects]);

  const lastSynced = ledger.length > 0
    ? ledger.reduce((max, e) => (e.synced_at > max ? e.synced_at : max), ledger[0].synced_at)
    : null;

  // Trend chart — last 12 months
  const trendMonths = months.slice(-12);
  const trendMax = useMemo(() => {
    let max = 0;
    for (const m of trendMonths) {
      max = Math.max(max, m.gelir, m.gider);
    }
    return max;
  }, [trendMonths]);

  const runwayTone =
    runwayMonths === Infinity ? 'safe' :
    runwayMonths >= 12 ? 'safe' :
    runwayMonths >= 6 ? 'warn' :
    'danger';

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <PageHeader
        title="Runway"
        subtitle="Helios SciTech · Cash Runway Dashboard"
        syncedAt={lastSynced}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={error} />
      ) : (
        <>
          {/* Hero — Runway big number */}
          <div className={cn(
            'rounded-2xl p-8 border',
            runwayTone === 'safe' ? 'bg-teal-bg border-teal-text/20'
            : runwayTone === 'warn' ? 'bg-amber-bg border-amber-text/20'
            : 'bg-red-50 border-red-200'
          )}>
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Flame size={14} className={cn(
                    runwayTone === 'safe' ? 'text-teal-text'
                    : runwayTone === 'warn' ? 'text-amber-text'
                    : 'text-red-500'
                  )} />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-text-3">Cash Runway</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className={cn(
                    'text-[72px] font-black leading-none tabular-nums',
                    runwayTone === 'safe' ? 'text-teal-text'
                    : runwayTone === 'warn' ? 'text-amber-text'
                    : 'text-red-500'
                  )}>
                    {runwayMonths === Infinity ? '∞' : runwayMonths.toFixed(1)}
                  </span>
                  <span className="text-[20px] font-bold text-text-2">
                    {runwayMonths === Infinity ? 'sınırsız' : 'ay'}
                  </span>
                </div>
                <p className="text-[13px] text-text-2 mt-3 max-w-xl">
                  {runwayMonths === Infinity
                    ? 'Son aylarda gider yok — runway hesaplanamadı.'
                    : runwayMonths <= 0
                    ? 'Mevcut nakit pozitif değil — runway bitti.'
                    : <>Mevcut nakit ile son {burn.window} ayın ortalama yakım hızında <strong>{runwayMonths.toFixed(1)} ay</strong> daha dayanır.{runwayEndDate && (
                        <> Tahmini bitiş: <strong>{TR_MONTHS_LONG[runwayEndDate.getMonth()]} {runwayEndDate.getFullYear()}</strong>.</>
                      )}</>
                  }
                </p>
              </div>
              {runwayTone === 'danger' && (
                <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-red-200">
                  <AlertTriangle size={20} className="text-red-500" />
                  <div>
                    <div className="text-[12px] font-bold text-red-500">Kritik</div>
                    <div className="text-[11px] text-text-3">6 aydan az runway</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Mevcut Nakit"
              hint="Toplam gelir − toplam gider (TL)"
              icon={<Wallet size={18} />}
              iconBg={currentCash >= 0 ? 'bg-teal-bg' : 'bg-red-50'}
              iconColor={currentCash >= 0 ? 'text-teal-text' : 'text-red-500'}
            >
              <span className={cn('text-[24px] font-black leading-none tabular-nums', currentCash >= 0 ? 'text-teal-text' : 'text-red-500')}>
                {formatMoney(currentCash)}
              </span>
            </StatCard>
            <StatCard
              label="Aylık Ortalama Yakım"
              hint={`Son ${burn.window} ayın gider ortalaması`}
              icon={<TrendingDown size={18} />}
              iconBg="bg-red-50"
              iconColor="text-red-500"
            >
              <span className="text-[24px] font-black leading-none tabular-nums text-red-500">
                {formatMoney(burn.avg)}
              </span>
            </StatCard>
            <StatCard
              label="Tahmini Tükenme"
              hint="Mevcut yakım hızında"
              icon={<Calendar size={18} />}
              iconBg="bg-info-bg"
              iconColor="text-info-text"
            >
              <span className="text-[24px] font-black leading-none tabular-nums text-text">
                {runwayEndDate ? `${TR_MONTHS_SHORT[runwayEndDate.getMonth()]} ${runwayEndDate.getFullYear()}` : runwayMonths === Infinity ? '—' : 'Bitti'}
              </span>
            </StatCard>
          </div>

          {/* Trend chart */}
          <div className="bg-white border border-border/40 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-black text-text">Aylık Trend</h2>
                <p className="text-[11px] text-text-3">Son 12 ay · Gelir vs Gider (TL)</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-text-3 font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-teal-text" /> Gelir</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Gider</span>
              </div>
            </div>
            {trendMonths.length === 0 || trendMax === 0 ? (
              <div className="py-12 text-center text-[12px] text-text-3 italic">Trend için yeterli veri yok.</div>
            ) : (
              <div className="flex items-end gap-1.5 h-48 mt-2">
                {trendMonths.map((m) => {
                  const gelirH = trendMax > 0 ? (m.gelir / trendMax) * 100 : 0;
                  const giderH = trendMax > 0 ? (m.gider / trendMax) * 100 : 0;
                  return (
                    <div key={m.key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                      <div className="flex-1 w-full flex items-end justify-center gap-0.5">
                        <div
                          className="flex-1 bg-teal-text rounded-t transition-all hover:opacity-80"
                          style={{ height: `${gelirH}%`, minHeight: m.gelir > 0 ? '2px' : '0' }}
                          title={`${m.label} Gelir: ${formatMoney(m.gelir)}`}
                        />
                        <div
                          className="flex-1 bg-red-500 rounded-t transition-all hover:opacity-80"
                          style={{ height: `${giderH}%`, minHeight: m.gider > 0 ? '2px' : '0' }}
                          title={`${m.label} Gider: ${formatMoney(m.gider)}`}
                        />
                      </div>
                      <span className="text-[9px] text-text-3 font-semibold truncate">{m.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/30 text-[12px]">
              <div>
                <span className="text-text-3">12 Ay Toplam Gelir</span>
                <div className="font-bold text-teal-text tabular-nums">
                  {formatMoneyCompact(trendMonths.reduce((s, m) => s + m.gelir, 0))}
                </div>
              </div>
              <div>
                <span className="text-text-3">12 Ay Toplam Gider</span>
                <div className="font-bold text-red-500 tabular-nums">
                  {formatMoneyCompact(trendMonths.reduce((s, m) => s + m.gider, 0))}
                </div>
              </div>
            </div>
          </div>

          {/* Two-col: category + project breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category breakdown */}
            <div className="bg-white border border-border/40 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown size={14} className="text-red-500" />
                <div>
                  <h2 className="text-[15px] font-black text-text">Gider Kategorileri</h2>
                  <p className="text-[11px] text-text-3">Son {RUNWAY_WINDOW_MONTHS} ay · TL</p>
                </div>
              </div>
              {categoryBreakdown.length === 0 ? (
                <p className="text-[12px] text-text-3 italic py-4">Son {RUNWAY_WINDOW_MONTHS} ayda gider yok.</p>
              ) : (
                <div className="space-y-3">
                  {categoryBreakdown.map((c) => (
                    <div key={c.cat}>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[12px] font-semibold text-text-2">{c.cat}</span>
                        <span className="text-[11px] tabular-nums">
                          <span className="font-bold text-text">{formatMoney(c.amt)}</span>
                          <span className="text-text-3 ml-1.5">%{c.pct.toFixed(0)}</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${c.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top projects */}
            <div className="bg-white border border-border/40 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} className="text-info-text" />
                <div>
                  <h2 className="text-[15px] font-black text-text">En Çok Harcama Yapan Projeler</h2>
                  <p className="text-[11px] text-text-3">Tüm zaman · TL · Top 5</p>
                </div>
              </div>
              {topProjects.length === 0 ? (
                <p className="text-[12px] text-text-3 italic py-4">Proje gideri yok.</p>
              ) : (
                <div className="space-y-3">
                  {topProjects.map((p) => (
                    <div key={p.id}>
                      <div className="flex justify-between items-baseline mb-1 gap-2">
                        <span className="text-[12px] font-semibold text-text-2 truncate">
                          {p.no && <span className="text-text-3 font-mono mr-1.5">{p.no}</span>}
                          {p.name}
                        </span>
                        <span className="text-[11px] tabular-nums shrink-0">
                          <span className="font-bold text-text">{formatMoney(p.amt)}</span>
                          <span className="text-text-3 ml-1.5">%{p.pct.toFixed(0)}</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                        <div className="h-full bg-info-border rounded-full" style={{ width: `${p.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Methodology */}
          <div className="bg-surface-2 border border-border/30 rounded-xl p-4 text-[11px] text-text-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <div>
                <strong className="text-text-2">Hesaplama:</strong>{' '}
                Mevcut nakit = tüm zaman <em>gelir − gider</em> (TL).{' '}
                Aylık yakım = son {RUNWAY_WINDOW_MONTHS} tamamlanmış ayın gider ortalaması.{' '}
                Runway = mevcut nakit ÷ aylık yakım. Tek para birimi (TL) varsayılır;
                döviz işlemleri stat'lara dahil edilmez.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

