import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowDownRight, ArrowUpRight, Calendar, Search,
  TrendingDown, TrendingUp, Wallet, X,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { cn } from '../../../lib/utils';
import { formatTR, TR_MONTHS_LONG } from '../../../lib/dates';
import { formatMoney, PRIMARY_CURRENCY } from '../../../lib/currency';
import { isExpense, isIncome } from '../../../lib/ledger';
import {
  CurrencyLines, DetailField, ErrorBlock, LoadingBlock, PageHeader, StatCard, Td, Th,
} from '../../external-mirror/shared';
import { triggerExternalSync } from '../../../lib/external-sync';

type LedgerEntry = {
  id: string;
  tarih: string;
  tip: string;
  aciklama: string | null;
  tutar: number;
  para_birimi: string | null;
  kategori: string | null;
  fatura_no: string | null;
  referans_id: string | null;
  created_at: string;
  synced_at: string;
};

type MonthBucket = {
  key: string;        // 2026-04
  year: number;
  month: number;      // 0-11
  label: string;      // "Nisan 2026"
  byCurrency: Map<string, { gelir: number; gider: number; count: number }>;
};

const monthKey = (iso: string): { key: string; year: number; month: number } | null => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = d.getMonth();
  return { key: `${y}-${String(m + 1).padStart(2, '0')}`, year: y, month: m };
};

export const Accounting: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [tipFilter, setTipFilter] = useState<'all' | 'gelir' | 'gider'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const { data, error: fetchErr } = await supabase
      .from('external_accounting_ledger')
      .select('*')
      .order('tarih', { ascending: false })
      .order('created_at', { ascending: false });
    if (fetchErr) {
      setError(fetchErr.message);
      setLoading(false);
      return;
    }
    setEntries((data ?? []) as LedgerEntry[]);
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

  // Aggregations
  const monthBuckets = useMemo<MonthBucket[]>(() => {
    const buckets = new Map<string, MonthBucket>();
    for (const e of entries) {
      const mk = monthKey(e.tarih);
      if (!mk) continue;
      let bucket = buckets.get(mk.key);
      if (!bucket) {
        bucket = {
          key: mk.key,
          year: mk.year,
          month: mk.month,
          label: `${TR_MONTHS_LONG[mk.month]} ${mk.year}`,
          byCurrency: new Map(),
        };
        buckets.set(mk.key, bucket);
      }
      const cur = e.para_birimi ?? PRIMARY_CURRENCY;
      let stats = bucket.byCurrency.get(cur);
      if (!stats) {
        stats = { gelir: 0, gider: 0, count: 0 };
        bucket.byCurrency.set(cur, stats);
      }
      stats.count += 1;
      if (isIncome(e.tip)) stats.gelir += e.tutar;
      else if (isExpense(e.tip)) stats.gider += e.tutar;
    }
    return Array.from(buckets.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [entries]);

  // Top stats — para birimi başına ayrı (TRY + USD/EUR'u toplamak doğru olmadığı için).
  const topStats = useMemo(() => {
    type Stat = { gelir: number; gider: number };
    const byCurrency = new Map<string, Stat>();
    const ensure = (cur: string): Stat => {
      let s = byCurrency.get(cur);
      if (!s) {
        s = { gelir: 0, gider: 0 };
        byCurrency.set(cur, s);
      }
      return s;
    };
    for (const e of entries) {
      const cur = e.para_birimi || PRIMARY_CURRENCY;
      const s = ensure(cur);
      if (isIncome(e.tip)) s.gelir += e.tutar;
      else if (isExpense(e.tip)) s.gider += e.tutar;
    }
    const ordered = Array.from(byCurrency.entries()).sort(([a], [b]) => {
      const aTRY = a === 'TRY' || a === 'TL';
      const bTRY = b === 'TRY' || b === 'TL';
      if (aTRY && !bTRY) return -1;
      if (!aTRY && bTRY) return 1;
      return a.localeCompare(b);
    });
    return ordered;
  }, [entries]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) if (e.kategori) set.add(e.kategori);
    return Array.from(set).sort();
  }, [entries]);

  const monthOptions = useMemo(
    () => monthBuckets.map((b) => ({ key: b.key, label: b.label })),
    [monthBuckets]
  );

  // Filter
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (tipFilter === 'gelir' && !isIncome(e.tip)) return false;
      if (tipFilter === 'gider' && !isExpense(e.tip)) return false;
      if (categoryFilter !== 'all' && e.kategori !== categoryFilter) return false;
      if (monthFilter !== 'all') {
        const mk = monthKey(e.tarih);
        if (!mk || mk.key !== monthFilter) return false;
      }
      if (!q) return true;
      return (
        (e.aciklama ?? '').toLowerCase().includes(q) ||
        (e.fatura_no ?? '').toLowerCase().includes(q) ||
        (e.kategori ?? '').toLowerCase().includes(q) ||
        (e.referans_id ?? '').toLowerCase().includes(q)
      );
    });
  }, [entries, search, tipFilter, categoryFilter, monthFilter]);

  const lastSynced = entries.length > 0
    ? entries.reduce((max, e) => (e.synced_at > max ? e.synced_at : max), entries[0].synced_at)
    : null;

  const openEntry = openId ? entries.find((e) => e.id === openId) ?? null : null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <PageHeader
        title="Ön Muhasebe"
        subtitle="Helios SciTech · General Ledger"
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
          {(() => {
            const gelirValues = topStats.map(([cur, s]) => [cur, s.gelir] as [string, number]);
            const giderValues = topStats.map(([cur, s]) => [cur, s.gider] as [string, number]);
            const netValues = topStats.map(([cur, s]) => [cur, s.gelir - s.gider] as [string, number]);
            const anyNetNegative = netValues.some(([, v]) => v < 0);
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Toplam Gelir" hint="Hibe ve diğer gelirler" icon={<TrendingUp size={18} />} iconBg="bg-teal-bg" iconColor="text-teal-text">
                  <CurrencyLines values={gelirValues} valueColor="text-teal-text" />
                </StatCard>
                <StatCard label="Toplam Harcama" hint="Kasadan çıkan ödemeler" icon={<TrendingDown size={18} />} iconBg="bg-red-50" iconColor="text-red-500">
                  <CurrencyLines values={giderValues} valueColor="text-red-500" />
                </StatCard>
                <StatCard
                  label="Net Bakiye"
                  hint="Güncel nakit durumu"
                  icon={<Wallet size={18} />}
                  iconBg={anyNetNegative ? 'bg-red-50' : 'bg-teal-bg'}
                  iconColor={anyNetNegative ? 'text-red-500' : 'text-teal-text'}
                >
                  <CurrencyLines values={netValues} valueColor="text-teal-text" negativeColor="text-red-500" />
                </StatCard>
              </div>
            );
          })()}

          {/* Aylık Özet */}
          <div className="bg-white border border-border/40 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border/30 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-info-bg text-info-text flex items-center justify-center">
                <Calendar size={16} />
              </div>
              <div>
                <h2 className="text-[15px] font-black text-text">Aylık Özet</h2>
                <p className="text-[11px] text-text-3">Her ay için gelir / gider kırılımı (her para birimi ayrı)</p>
              </div>
            </div>
            {monthBuckets.length === 0 ? (
              <div className="p-8 text-center text-[12px] text-text-3 italic">Kayıt yok.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="bg-surface-2 text-text-3">
                    <tr>
                      <Th>Ay</Th>
                      <Th>Para Birimi</Th>
                      <Th align="right">Gelir</Th>
                      <Th align="right">Gider</Th>
                      <Th align="right">Net</Th>
                      <Th align="right">Kayıt</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthBuckets.flatMap((bucket) =>
                      Array.from(bucket.byCurrency.entries())
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([cur, s], idx) => {
                          const net = s.gelir - s.gider;
                          return (
                            <tr key={`${bucket.key}-${cur}`} className="border-t border-border/30 hover:bg-surface-2">
                              <Td>
                                {idx === 0 ? (
                                  <div className="flex items-center gap-2">
                                    <Calendar size={12} className="text-text-3" />
                                    <span className="font-bold text-text">{bucket.label}</span>
                                  </div>
                                ) : (
                                  <span className="text-text-3 italic pl-5">"</span>
                                )}
                              </Td>
                              <Td>
                                <span className="px-2 py-0.5 rounded bg-surface-2 text-text-2 text-[11px] font-bold tabular-nums">
                                  {cur}
                                </span>
                              </Td>
                              <Td align="right" className="font-bold text-teal-text tabular-nums">
                                {formatMoney(s.gelir, cur)}
                              </Td>
                              <Td align="right" className="font-bold text-red-500 tabular-nums">
                                {formatMoney(s.gider, cur)}
                              </Td>
                              <Td align="right" className={cn('font-bold tabular-nums', net >= 0 ? 'text-teal-text' : 'text-red-500')}>
                                {formatMoney(net, cur)}
                              </Td>
                              <Td align="right" className="text-text-3 tabular-nums">
                                {s.count}
                              </Td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Filter bar */}
          <div className="bg-white border border-border/40 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Açıklama, fatura no, kategori..."
                className="w-full pl-9 pr-3 py-2 text-[13px] rounded-lg bg-surface-2 border border-border/40 focus:outline-none focus:border-border"
              />
            </div>
            <select
              value={tipFilter}
              onChange={(e) => setTipFilter(e.target.value as typeof tipFilter)}
              className="px-3 py-2 text-[13px] rounded-lg bg-surface-2 border border-border/40 focus:outline-none focus:border-border"
            >
              <option value="all">Tüm Tipler</option>
              <option value="gelir">Sadece Gelir</option>
              <option value="gider">Sadece Gider</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-[13px] rounded-lg bg-surface-2 border border-border/40 focus:outline-none focus:border-border"
            >
              <option value="all">Tüm Kategoriler</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-3 py-2 text-[13px] rounded-lg bg-surface-2 border border-border/40 focus:outline-none focus:border-border"
            >
              <option value="all">Tüm Aylar</option>
              {monthOptions.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Entries table */}
          <div className="bg-white border border-border/40 rounded-2xl overflow-hidden">
            {visible.length === 0 ? (
              <div className="p-12 text-center text-[13px] text-text-3">
                {entries.length === 0 ? 'Henüz kayıt yok.' : 'Filtreye uyan kayıt yok.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="bg-surface-2 text-text-3">
                    <tr>
                      <Th>Tarih</Th>
                      <Th>Tip</Th>
                      <Th>Açıklama</Th>
                      <Th>Kategori</Th>
                      <Th>Fatura</Th>
                      <Th align="right">Tutar</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((e) => {
                      const income = isIncome(e.tip);
                      const expense = isExpense(e.tip);
                      return (
                        <tr
                          key={e.id}
                          onClick={() => setOpenId(e.id)}
                          className="border-t border-border/30 hover:bg-surface-2 cursor-pointer transition-colors"
                        >
                          <Td className="tabular-nums whitespace-nowrap">{formatTR(e.tarih)}</Td>
                          <Td>
                            {income ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-bg text-teal-text text-[10px] font-bold uppercase tracking-wide">
                                <ArrowUpRight size={10} /> Gelir
                              </span>
                            ) : expense ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-wide">
                                <ArrowDownRight size={10} /> Gider
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-surface-2 text-text-3 text-[10px] font-bold uppercase tracking-wide">
                                {e.tip}
                              </span>
                            )}
                          </Td>
                          <Td className="text-text-2 max-w-[320px] truncate" title={e.aciklama ?? ''}>
                            {e.aciklama ?? '—'}
                          </Td>
                          <Td>
                            {e.kategori ? (
                              <span className="px-2 py-0.5 rounded bg-surface-2 text-text-2 text-[10px] font-bold uppercase tracking-wide">
                                {e.kategori}
                              </span>
                            ) : '—'}
                          </Td>
                          <Td className="font-mono text-[12px] text-text-3">{e.fatura_no ?? '—'}</Td>
                          <Td
                            align="right"
                            className={cn(
                              'font-bold tabular-nums whitespace-nowrap',
                              income ? 'text-teal-text' : expense ? 'text-red-500' : 'text-text'
                            )}
                          >
                            {expense ? '−' : income ? '+' : ''}{formatMoney(e.tutar, e.para_birimi)}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {visible.length > 0 && (
              <div className="px-4 py-3 border-t border-border/30 bg-surface-2 text-[11px] text-text-3 flex justify-between items-center">
                <span>{visible.length} kayıt</span>
              </div>
            )}
          </div>
        </>
      )}

      {openEntry && <LedgerDetailModal entry={openEntry} onClose={() => setOpenId(null)} />}
    </div>
  );
};

const LedgerDetailModal: React.FC<{
  entry: LedgerEntry;
  onClose: () => void;
}> = ({ entry, onClose }) => {
  const income = isIncome(entry.tip);
  const expense = isExpense(entry.tip);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[18px] font-black text-text leading-tight truncate">
              {entry.aciklama ?? 'Açıklamasız Kayıt'}
            </h2>
            <p className="text-[11px] text-text-3 mt-0.5">
              {formatTR(entry.tarih)}
              {entry.fatura_no && <> · <span className="font-mono">{entry.fatura_no}</span></>}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-2 text-text-3" title="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Headline amount */}
          <div className="bg-surface-2 rounded-2xl p-5 flex items-end justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-text-3 font-semibold">Tutar</span>
              <div className={cn(
                'text-[32px] font-black leading-none mt-1 tabular-nums',
                income ? 'text-teal-text' : expense ? 'text-red-500' : 'text-text'
              )}>
                {expense ? '−' : income ? '+' : ''}{formatMoney(entry.tutar, entry.para_birimi)}
              </div>
            </div>
            {income ? (
              <span className="px-3 py-1.5 rounded-full bg-teal-bg text-teal-text text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5">
                <ArrowUpRight size={12} /> Gelir
              </span>
            ) : expense ? (
              <span className="px-3 py-1.5 rounded-full bg-red-50 text-red-500 text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5">
                <ArrowDownRight size={12} /> Gider
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-surface-2 text-text-3 text-[11px] font-bold uppercase tracking-wide">
                {entry.tip}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {entry.kategori && <DetailField label="Kategori" value={entry.kategori} />}
            {entry.para_birimi && <DetailField label="Para Birimi" value={entry.para_birimi} />}
            {entry.fatura_no && <DetailField label="Fatura No" value={entry.fatura_no} />}
            {entry.referans_id && <DetailField label="Referans ID" value={entry.referans_id} />}
          </div>

          {entry.aciklama && (
            <div>
              <span className="text-[10px] uppercase tracking-widest text-text-3 font-semibold flex items-center gap-1.5">
                <AlertCircle size={11} /> Açıklama
              </span>
              <p className="text-[13px] text-text-2 mt-2 whitespace-pre-line">{entry.aciklama}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

