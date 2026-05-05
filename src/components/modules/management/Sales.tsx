import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowUpRight, Calendar, CheckCircle2, Clock,
  Search, TrendingUp, Wallet, X,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { cn } from '../../../lib/utils';
import { formatTR } from '../../../lib/dates';
import { formatMoney, isTRY, PRIMARY_CURRENCY } from '../../../lib/currency';
import {
  CurrencyLines, DetailField, ErrorBlock, LoadingBlock, PageHeader, StatCard, Td, Th,
} from '../../external-mirror/shared';
import { triggerExternalSync } from '../../../lib/external-sync';

type SalesRecord = {
  id: string;
  tarih: string;
  fatura_no: string | null;
  musteri_id: string | null;
  musteri_adi: string | null;
  urun_hizmet_adi: string | null;
  kategori: string | null;
  miktar: number | null;
  birim: string | null;
  birim_fiyat: number | null;
  para_birimi: string | null;
  kdv_orani: number | null;
  tutar_kdv_haric: number | null;
  tutar_kdv_dahil: number | null;
  tahsilat_durumu: string | null;
  odeme_yontemi: string | null;
  notlar: string | null;
  fatura_tarihi: string | null;
  vade_tarihi: string | null;
  musteri_turu: string | null;
  musteri_vergi_no: string | null;
  yurtdisi: string | null;
  irsaliye_no: string | null;
  tahsilat_tarihi: string | null;
  tahsil_edilen: number | null;
  inventory_item_id: string | null;
  created_at: string;
  synced_at: string;
};

type Customer = {
  id: string;
  ad: string;
  tur: string | null;
  email: string | null;
  telefon: string | null;
  country: string | null;
};

type TahsilatLog = {
  id: string;
  satis_id: string | null;
  tutar: number;
  tarih: string;
  notlar: string | null;
};

type StatusKey = 'tahsil' | 'kismi' | 'bekliyor' | 'gecikti';

// helios-portal'ın text alanı (`tahsilat_durumu`) bizim StatusKey'imize haritala.
// Yazımı esnek tut: "tahsil edildi", "tahsil-edildi", "TAHSIL_EDILDI" hepsi eşleşsin.
const normalizeTahsilatDurumu = (raw: string | null | undefined): StatusKey | null => {
  if (!raw) return null;
  const v = raw.toLowerCase().replace(/[\s_-]/g, '');
  if (v.includes('kis') || v.includes('kıs')) return 'kismi';
  if (v.includes('gecik')) return 'gecikti';
  if (v.includes('bekl')) return 'bekliyor';
  if (v.includes('tahsil') || v.includes('odendi') || v.includes('ödendi')) return 'tahsil';
  return null;
};

const computeStatus = (rec: SalesRecord): StatusKey => {
  // helios-portal'da kullanıcı bir satışı manuel olarak "tahsil edildi" işaretlediğinde
  // `tahsilat_durumu` text alanı set edilir, ama `tahsil_edilen` sayısı bazen 0 kalıyor.
  // Bu yüzden text alanı authoritative — ona güveniyoruz.
  const explicit = normalizeTahsilatDurumu(rec.tahsilat_durumu);
  if (explicit) return explicit;

  const total = rec.tutar_kdv_dahil ?? 0;
  const paid = rec.tahsil_edilen ?? 0;
  if (total > 0 && paid >= total) return 'tahsil';
  if (paid > 0) return 'kismi';
  if (rec.vade_tarihi) {
    const due = new Date(rec.vade_tarihi);
    if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) return 'gecikti';
  }
  return 'bekliyor';
};

// Status 'tahsil' ise ödenmiş tutarı total'a eşitle (helios-portal'da
// tahsil_edilen 0 kalmış olabilir). Diğer durumlarda field'a güven.
const effectivePaid = (rec: SalesRecord): number => {
  const total = rec.tutar_kdv_dahil ?? 0;
  const paid = rec.tahsil_edilen ?? 0;
  if (computeStatus(rec) === 'tahsil') return Math.max(paid, total);
  return paid;
};

const STATUS_META: Record<StatusKey, { label: string; bg: string; text: string }> = {
  tahsil:    { label: 'Tahsil Edildi', bg: 'bg-teal-bg',   text: 'text-teal-text' },
  kismi:     { label: 'Kısmi Tahsilat',  bg: 'bg-amber-bg',  text: 'text-amber-text' },
  bekliyor:  { label: 'Bekliyor',        bg: 'bg-surface-2', text: 'text-text-3' },
  gecikti:   { label: 'Gecikti',         bg: 'bg-red-50',    text: 'text-red-500' },
};

const isCurrentMonth = (iso: string): boolean => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};


export const Sales: React.FC = () => {
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [customers, setCustomers] = useState<Map<string, Customer>>(new Map());
  const [tahsilatLogs, setTahsilatLogs] = useState<TahsilatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusKey | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [salesRes, custRes, logsRes] = await Promise.all([
      supabase
        .from('external_sales_records')
        .select('*')
        .order('tarih', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('external_customers').select('*'),
      supabase.from('external_tahsilat_logs').select('*').order('tarih', { ascending: false }),
    ]);
    if (salesRes.error) {
      setError(salesRes.error.message);
      setLoading(false);
      return;
    }
    setRecords((salesRes.data ?? []) as SalesRecord[]);
    const cmap = new Map<string, Customer>();
    for (const c of (custRes.data ?? []) as Customer[]) cmap.set(c.id, c);
    setCustomers(cmap);
    setTahsilatLogs((logsRes.data ?? []) as TahsilatLog[]);
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

  // Filter
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter !== 'all' && computeStatus(r) !== statusFilter) return false;
      if (categoryFilter !== 'all' && r.kategori !== categoryFilter) return false;
      if (!q) return true;
      const cust = r.musteri_id ? customers.get(r.musteri_id) : undefined;
      return (
        (r.musteri_adi ?? '').toLowerCase().includes(q) ||
        (cust?.ad ?? '').toLowerCase().includes(q) ||
        (r.fatura_no ?? '').toLowerCase().includes(q) ||
        (r.urun_hizmet_adi ?? '').toLowerCase().includes(q) ||
        (r.irsaliye_no ?? '').toLowerCase().includes(q)
      );
    });
  }, [records, search, statusFilter, categoryFilter, customers]);

  // Stats — para birimi başına ayrı toplam. Farklı kurları toplamak doğru olmadığı için
  // her döviz kendi satırında gösterilir.
  const stats = useMemo(() => {
    type CurrencyStat = { ciro: number; buAy: number; tahsil: number; bekleyen: number };
    const byCurrency = new Map<string, CurrencyStat>();
    let geciktiCount = 0;
    const ensure = (cur: string): CurrencyStat => {
      let s = byCurrency.get(cur);
      if (!s) {
        s = { ciro: 0, buAy: 0, tahsil: 0, bekleyen: 0 };
        byCurrency.set(cur, s);
      }
      return s;
    };
    for (const r of records) {
      const cur = r.para_birimi || PRIMARY_CURRENCY;
      const s = ensure(cur);
      const total = r.tutar_kdv_dahil ?? 0;
      const paid = effectivePaid(r);
      s.ciro += total;
      s.tahsil += paid;
      s.bekleyen += Math.max(0, total - paid);
      if (isCurrentMonth(r.tarih)) s.buAy += total;
      if (computeStatus(r) === 'gecikti') geciktiCount += 1;
    }
    // TRY/TL'yi başa koy, sonra alfabetik
    const ordered = Array.from(byCurrency.entries()).sort(([a], [b]) => {
      const aTRY = a === 'TRY' || a === 'TL';
      const bTRY = b === 'TRY' || b === 'TL';
      if (aTRY && !bTRY) return -1;
      if (!aTRY && bTRY) return 1;
      return a.localeCompare(b);
    });
    return { byCurrency: ordered, geciktiCount };
  }, [records]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) if (r.kategori) set.add(r.kategori);
    return Array.from(set).sort();
  }, [records]);

  const lastSynced = records.length > 0
    ? records.reduce((max, r) => (r.synced_at > max ? r.synced_at : max), records[0].synced_at)
    : null;

  const openRecord = openId ? records.find((r) => r.id === openId) ?? null : null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <PageHeader
        title="Satış"
        subtitle="Helios SciTech · Sales Records"
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Toplam Ciro" icon={<TrendingUp size={18} />} iconBg="bg-teal-bg" iconColor="text-teal-text">
              <CurrencyLines values={stats.byCurrency.map(([cur, s]) => [cur, s.ciro])} valueColor="text-text" />
            </StatCard>
            <StatCard label="Bu Ay" icon={<Calendar size={18} />} iconBg="bg-info-bg" iconColor="text-info-text">
              <CurrencyLines values={stats.byCurrency.map(([cur, s]) => [cur, s.buAy])} valueColor="text-sky-600" />
            </StatCard>
            <StatCard label="Tahsil Edilen" icon={<CheckCircle2 size={18} />} iconBg="bg-teal-bg" iconColor="text-teal-text">
              <CurrencyLines values={stats.byCurrency.map(([cur, s]) => [cur, s.tahsil])} valueColor="text-teal-text" />
            </StatCard>
            <StatCard
              label="Bekleyen Tahsilat"
              icon={<Wallet size={18} />}
              iconBg="bg-amber-bg"
              iconColor="text-amber-text"
              hint={stats.geciktiCount > 0 ? `${stats.geciktiCount} gecikmiş` : undefined}
              hintColor="text-red-500"
            >
              <CurrencyLines
                values={stats.byCurrency.map(([cur, s]) => [cur, s.bekleyen])}
                valueColor="text-amber-500"
                zeroColor="text-text-3"
              />
            </StatCard>
          </div>

          {/* Filter bar */}
          <div className="bg-white border border-border/40 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Müşteri, fatura no, ürün, irsaliye..."
                className="w-full pl-9 pr-3 py-2 text-[13px] rounded-lg bg-surface-2 border border-border/40 focus:outline-none focus:border-border"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusKey | 'all')}
              className="px-3 py-2 text-[13px] rounded-lg bg-surface-2 border border-border/40 focus:outline-none focus:border-border"
            >
              <option value="all">Tüm Tahsilat Durumları</option>
              <option value="tahsil">Tahsil Edildi</option>
              <option value="kismi">Kısmi Tahsilat</option>
              <option value="bekliyor">Bekliyor</option>
              <option value="gecikti">Gecikti</option>
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
          </div>

          {/* Table */}
          <div className="bg-white border border-border/40 rounded-2xl overflow-hidden">
            {visible.length === 0 ? (
              <div className="p-12 text-center text-[13px] text-text-3">
                {records.length === 0 ? 'Henüz satış kaydı yok.' : 'Filtreye uyan kayıt yok.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="bg-surface-2 text-text-3">
                    <tr>
                      <Th>Tarih</Th>
                      <Th>Fatura No</Th>
                      <Th>Müşteri</Th>
                      <Th>Ürün / Hizmet</Th>
                      <Th>Kategori</Th>
                      <Th align="right">Tutar (KDV Dahil)</Th>
                      <Th>Tahsilat</Th>
                      <Th align="right" />
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r) => {
                      const status = computeStatus(r);
                      const meta = STATUS_META[status];
                      const cust = r.musteri_id ? customers.get(r.musteri_id) : undefined;
                      const custName = r.musteri_adi || cust?.ad || '—';
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setOpenId(r.id)}
                          className="border-t border-border/30 hover:bg-surface-2 cursor-pointer transition-colors"
                        >
                          <Td className="tabular-nums whitespace-nowrap">{formatTR(r.tarih)}</Td>
                          <Td className="font-mono text-[12px] text-text-2">{r.fatura_no ?? '—'}</Td>
                          <Td className="font-bold text-text">
                            <div className="flex flex-col">
                              <span>{custName}</span>
                              {r.musteri_turu && <span className="text-[10px] text-text-3 font-normal">{r.musteri_turu}</span>}
                            </div>
                          </Td>
                          <Td className="text-text-2 max-w-60 truncate" title={r.urun_hizmet_adi ?? ''}>
                            {r.urun_hizmet_adi ?? '—'}
                          </Td>
                          <Td>
                            {r.kategori ? (
                              <span className="px-2 py-0.5 rounded bg-surface-2 text-text-2 text-[10px] font-bold uppercase tracking-wide">
                                {r.kategori}
                              </span>
                            ) : '—'}
                          </Td>
                          <Td align="right" className="font-bold tabular-nums">
                            {r.tutar_kdv_dahil !== null ? formatMoney(r.tutar_kdv_dahil, r.para_birimi) : '—'}
                          </Td>
                          <Td>
                            <div className="flex flex-col gap-0.5">
                              <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide w-fit', meta.bg, meta.text)}>
                                {meta.label}
                              </span>
                              {(r.tahsil_edilen ?? 0) > 0 && (r.tahsil_edilen ?? 0) < (r.tutar_kdv_dahil ?? 0) && (
                                <span className="text-[10px] text-text-3 tabular-nums">
                                  {formatMoney(r.tahsil_edilen ?? 0, r.para_birimi)} / {formatMoney(r.tutar_kdv_dahil ?? 0, r.para_birimi)}
                                </span>
                              )}
                            </div>
                          </Td>
                          <Td align="right">
                            <ArrowUpRight size={14} className="text-text-3 inline-block" />
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
                <span className="tabular-nums flex items-center gap-3">
                  <span>Toplam:</span>
                  {(() => {
                    const totals = new Map<string, number>();
                    for (const r of visible) {
                      const cur = r.para_birimi || PRIMARY_CURRENCY;
                      totals.set(cur, (totals.get(cur) ?? 0) + (r.tutar_kdv_dahil ?? 0));
                    }
                    const ordered = Array.from(totals.entries()).sort(([a], [b]) => {
                      if (isTRY(a) && !isTRY(b)) return -1;
                      if (!isTRY(a) && isTRY(b)) return 1;
                      return a.localeCompare(b);
                    });
                    return ordered.map(([cur, total]) => (
                      <span key={cur} className="font-bold text-text-2">{formatMoney(total, cur)}</span>
                    ));
                  })()}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {openRecord && (
        <SaleDetailModal
          record={openRecord}
          customer={openRecord.musteri_id ? customers.get(openRecord.musteri_id) : undefined}
          tahsilatLogs={tahsilatLogs.filter((l) => l.satis_id === openRecord.id)}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
};

const SaleDetailModal: React.FC<{
  record: SalesRecord;
  customer: Customer | undefined;
  tahsilatLogs: TahsilatLog[];
  onClose: () => void;
}> = ({ record, customer, tahsilatLogs, onClose }) => {
  const status = computeStatus(record);
  const meta = STATUS_META[status];
  const total = record.tutar_kdv_dahil ?? 0;
  const paid = effectivePaid(record);
  const remaining = Math.max(0, total - paid);
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[18px] font-black text-text leading-tight">
              {record.musteri_adi || customer?.ad || 'Bilinmiyor'}
            </h2>
            <p className="text-[11px] text-text-3 font-mono mt-0.5">
              Fatura: {record.fatura_no ?? '—'} · {formatTR(record.tarih)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-2 text-text-3" title="Kapat">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Headline amount */}
          <div className="bg-surface-2 rounded-2xl p-5 space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-text-3 font-semibold">Tutar (KDV Dahil)</span>
                <div className="text-[32px] font-black text-text leading-none mt-1 tabular-nums">
                  {formatMoney(total, record.para_birimi)}
                </div>
                {record.tutar_kdv_haric !== null && (
                  <div className="text-[11px] text-text-3 mt-1">
                    KDV Hariç: <span className="font-bold tabular-nums">{formatMoney(record.tutar_kdv_haric, record.para_birimi)}</span>
                    {record.kdv_orani !== null && <span> · KDV %{record.kdv_orani}</span>}
                  </div>
                )}
              </div>
              <span className={cn('px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide', meta.bg, meta.text)}>
                {meta.label}
              </span>
            </div>

            {/* Progress */}
            {total > 0 && (
              <div className="space-y-2">
                <div className="h-2 bg-white rounded-full overflow-hidden border border-border/40">
                  <div
                    className={cn(
                      'h-full transition-all',
                      status === 'tahsil' ? 'bg-teal-text' : status === 'gecikti' ? 'bg-red-500' : 'bg-amber-500'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] tabular-nums">
                  <span className="text-text-3">
                    Tahsil: <span className="font-bold text-text-2">{formatMoney(paid, record.para_birimi)}</span>
                  </span>
                  <span className="text-text-3">
                    Kalan: <span className="font-bold text-text-2">{formatMoney(remaining, record.para_birimi)}</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Two-col fields */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {record.urun_hizmet_adi && <DetailField label="Ürün / Hizmet" value={record.urun_hizmet_adi} />}
            {record.kategori && <DetailField label="Kategori" value={record.kategori} />}
            {record.miktar !== null && (
              <DetailField label="Miktar" value={`${record.miktar}${record.birim ? ` ${record.birim}` : ''}`} />
            )}
            {record.birim_fiyat !== null && (
              <DetailField label="Birim Fiyat" value={formatMoney(record.birim_fiyat, record.para_birimi)} />
            )}
            {record.fatura_tarihi && <DetailField label="Fatura Tarihi" value={formatTR(record.fatura_tarihi)} />}
            {record.vade_tarihi && <DetailField label="Vade Tarihi" value={formatTR(record.vade_tarihi)} />}
            {record.tahsilat_tarihi && <DetailField label="Tahsilat Tarihi" value={formatTR(record.tahsilat_tarihi)} />}
            {record.odeme_yontemi && <DetailField label="Ödeme Yöntemi" value={record.odeme_yontemi} />}
            {record.irsaliye_no && <DetailField label="İrsaliye No" value={record.irsaliye_no} />}
            {record.musteri_turu && <DetailField label="Müşteri Türü" value={record.musteri_turu} />}
            {record.musteri_vergi_no && <DetailField label="Vergi No" value={record.musteri_vergi_no} />}
            {record.yurtdisi && <DetailField label="Yurt Dışı" value={record.yurtdisi} />}
          </div>

          {/* Customer extras */}
          {customer && (customer.email || customer.telefon || customer.country) && (
            <div className="bg-surface-2 rounded-xl p-4 space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-text-3 font-semibold">Müşteri Bilgisi</span>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-text-2">
                {customer.email && <span><span className="text-text-3">E-posta:</span> {customer.email}</span>}
                {customer.telefon && <span><span className="text-text-3">Telefon:</span> {customer.telefon}</span>}
                {customer.country && <span><span className="text-text-3">Ülke:</span> {customer.country}</span>}
              </div>
            </div>
          )}

          {/* Tahsilat history */}
          <div>
            <span className="text-[10px] uppercase tracking-widest text-text-3 font-semibold flex items-center gap-1.5">
              <Clock size={11} /> Tahsilat Geçmişi
            </span>
            {tahsilatLogs.length === 0 ? (
              <p className="text-[12px] text-text-3 italic mt-2">Tahsilat kaydı yok.</p>
            ) : (
              <div className="mt-2 space-y-1">
                {tahsilatLogs.map((l) => (
                  <div key={l.id} className="flex items-start gap-3 py-2 border-b border-border/30 text-[12px]">
                    <span className="text-text-3 tabular-nums shrink-0 w-24">{formatTR(l.tarih)}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-text-2 tabular-nums">{formatMoney(l.tutar, record.para_birimi)}</span>
                      {l.notlar && <span className="text-text-3"> — {l.notlar}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {record.notlar && (
            <div>
              <span className="text-[10px] uppercase tracking-widest text-text-3 font-semibold flex items-center gap-1.5">
                <AlertCircle size={11} /> Notlar
              </span>
              <p className="text-[13px] text-text-2 mt-2 whitespace-pre-line">{record.notlar}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

