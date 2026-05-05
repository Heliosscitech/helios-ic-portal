import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, Beaker, ChevronRight, Gem,
  Package, Search, Syringe, TestTube, Wrench, X, Zap,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { cn } from '../../../lib/utils';
import { formatTR } from '../../../lib/dates';
import {
  DetailField, ErrorBlock, LoadingBlock, PageHeader, StatCard,
} from '../../external-mirror/shared';
import { triggerExternalSync } from '../../../lib/external-sync';

type LabItem = {
  id: string;
  name: string;
  category: string;
  quantity: number | null;
  min_stock: number | null;
  unit: string | null;
  location: string | null;
  notes: string | null;
  model: string | null;
  serial: string | null;
  chem_type: string | null;
  cas: string | null;
  purity: string | null;
  storage: string | null;
  hazards: string[] | null;
  synthesis_date: string | null;
  mof_yield: string | null;
  color: string | null;
  appearance: string | null;
  updated_at: string;
  synced_at: string;
};

type LabHistory = {
  id: string;
  action: string;
  item: string;
  detail: string | null;
  date: string;
  inventory_item_id: string | null;
};

type CategoryStyle = {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  qtyColor: string;
};

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  'Cam Malzemeler': {
    icon: <TestTube size={18} />,
    iconBg: 'bg-teal-bg',
    iconColor: 'text-teal-text',
    qtyColor: 'text-amber-text',
  },
  'Elektronik Cihazlar': {
    icon: <Zap size={18} />,
    iconBg: 'bg-amber-bg',
    iconColor: 'text-amber-text',
    qtyColor: 'text-amber-text',
  },
  'Ölçüm & Dozajlama': {
    icon: <Syringe size={18} />,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-700',
    qtyColor: 'text-rose-700',
  },
  'Genel Ekipman': {
    icon: <Wrench size={18} />,
    iconBg: 'bg-surface-2',
    iconColor: 'text-text-2',
    qtyColor: 'text-text-2',
  },
  'Kimyasallar': {
    icon: <Beaker size={18} />,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-700',
    qtyColor: 'text-sky-700',
  },
  'MOFlar': {
    icon: <Gem size={18} />,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-700',
    qtyColor: 'text-violet-700',
  },
};

const DEFAULT_STYLE: CategoryStyle = {
  icon: <Package size={18} />,
  iconBg: 'bg-surface-2',
  iconColor: 'text-text-2',
  qtyColor: 'text-text-2',
};

const styleFor = (category: string): CategoryStyle =>
  CATEGORY_STYLES[category] ?? DEFAULT_STYLE;

const isChemicalCategory = (cat: string): boolean => {
  const c = cat.toLowerCase();
  return c.includes('kimyas') || c.includes('mof') || c.includes('reagent') || c.includes('reaktif');
};

const formatNumber = (n: number): string =>
  Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');

const isLowStock = (item: LabItem): boolean =>
  // min_stock = "minimum kabul edilebilir miktar" — o seviyeye eşit/altına düşünce uyarı.
  // min_stock=0 ise eşik yok demektir (MİKSER gibi); flag'lenmesin.
  item.min_stock !== null && item.min_stock > 0 && item.quantity !== null && item.quantity <= item.min_stock && item.quantity > 0;

const isOutOfStock = (item: LabItem): boolean =>
  item.quantity !== null && item.quantity <= 0;

export const LabStock: React.FC = () => {
  const [items, setItems] = useState<LabItem[]>([]);
  const [history, setHistory] = useState<LabHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [invRes, histRes] = await Promise.all([
      supabase
        .from('external_lab_inventory')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true }),
      supabase
        .from('external_lab_history')
        .select('*')
        .order('date', { ascending: false })
        .limit(500),
    ]);
    if (invRes.error) {
      setError(invRes.error.message);
      setLoading(false);
      return;
    }
    setItems((invRes.data ?? []) as LabItem[]);
    setHistory((histRes.data ?? []) as LabHistory[]);
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
  const totalCount = items.length;

  const inventoryByUnit = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) {
      if (it.quantity === null || it.quantity <= 0) continue;
      const unit = (it.unit ?? '').trim() || 'adet';
      map.set(unit, (map.get(unit) ?? 0) + it.quantity);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [items]);

  const lowStockItems = useMemo(() => items.filter(isLowStock), [items]);
  const outOfStockItems = useMemo(() => items.filter(isOutOfStock), [items]);

  const categories = useMemo(() => {
    const map = new Map<string, LabItem[]>();
    for (const it of items) {
      const arr = map.get(it.category) ?? [];
      arr.push(it);
      map.set(it.category, arr);
    }
    return Array.from(map.entries())
      .map(([name, arr]) => ({ name, items: arr }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }, [items]);

  const lastSynced = items.length > 0
    ? items.reduce((max, it) => (it.synced_at > max ? it.synced_at : max), items[0].synced_at)
    : null;

  const openItems = openCategory ? categories.find((c) => c.name === openCategory)?.items ?? [] : [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <PageHeader
        title="Laboratuvar Özeti"
        subtitle="Helios SciTech · Laboratory Control Center"
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
            <StatCard label="Toplam Çeşit">
              <span className="text-[44px] font-black leading-none">{totalCount}</span>
            </StatCard>

            <StatCard label="Envanter Özeti">
              {inventoryByUnit.length === 0 ? (
                <span className="text-[44px] font-black leading-none">0</span>
              ) : (
                <div className="space-y-1">
                  {inventoryByUnit.map(([unit, total]) => (
                    <div key={unit} className="flex items-baseline gap-1.5">
                      <span className="text-[28px] font-black leading-none text-teal-text">
                        {formatNumber(total)}
                      </span>
                      <span className="text-[12px] text-text-3 font-semibold">{unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </StatCard>

            <StatCard label="Düşük Stok">
              <span className={cn('text-[44px] font-black leading-none', lowStockItems.length > 0 ? 'text-amber-500' : 'text-text-3')}>
                {lowStockItems.length}
              </span>
            </StatCard>

            <StatCard label="Stokta Yok">
              <span className={cn('text-[44px] font-black leading-none', outOfStockItems.length > 0 ? 'text-red-500' : 'text-text-3')}>
                {outOfStockItems.length}
              </span>
            </StatCard>
          </div>

          {/* Stok Uyarıları */}
          {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
            <div className="bg-red-50 border border-red-200/60 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" />
                <h2 className="text-[14px] font-bold text-red-500">Stok Uyarıları</h2>
              </div>
              <div className="space-y-2">
                {[...outOfStockItems, ...lowStockItems].map((it) => (
                  <div
                    key={it.id}
                    className="bg-white rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <span className="text-[13px] font-bold text-text">{it.name}</span>
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-widest',
                      isOutOfStock(it) ? 'text-red-500' : 'text-amber-500'
                    )}>
                      {isOutOfStock(it) ? 'Tükendi' : `Stok: ${formatNumber(it.quantity ?? 0)}${it.unit ? ` ${it.unit}` : ''}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.length === 0 ? (
              <div className="col-span-full bg-white border border-border/40 rounded-2xl p-12 text-center text-[13px] text-text-3">
                Henüz veri yok. İlk senkron tamamlandı mı?
              </div>
            ) : (
              categories.map((cat) => (
                <CategoryCard
                  key={cat.name}
                  name={cat.name}
                  items={cat.items}
                  onOpen={() => setOpenCategory(cat.name)}
                />
              ))
            )}
          </div>

        </>
      )}

      {/* Detail modal */}
      {openCategory && (
        <CategoryDetailModal
          category={openCategory}
          items={openItems}
          history={history}
          onClose={() => setOpenCategory(null)}
        />
      )}
    </div>
  );
};

const CategoryCard: React.FC<{
  name: string;
  items: LabItem[];
  onOpen: () => void;
}> = ({ name, items, onOpen }) => {
  const style = styleFor(name);
  const cesitCount = items.length;
  const totalQty = items.reduce((s, it) => s + (it.quantity ?? 0), 0);
  const unit = items[0]?.unit ?? 'adet';

  // En çok 3 satır göster — fazlası "Görüntüle"de
  const preview = items.slice(0, 3);

  return (
    <div className="bg-white border border-border/40 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', style.iconBg, style.iconColor)}>
            {style.icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-black text-text leading-tight">{name}</h3>
            <p className="text-[11px] text-text-3 font-semibold mt-0.5">
              {cesitCount} çeşit · {formatNumber(totalQty)} {unit}
            </p>
          </div>
        </div>
        <button
          onClick={onOpen}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-[11px] font-semibold text-text-2 transition-colors"
        >
          Görüntüle
          <ChevronRight size={12} />
        </button>
      </div>

      {preview.length > 0 ? (
        <div className="flex flex-col">
          {preview.map((it, i) => (
            <div
              key={it.id}
              className={cn(
                'flex items-center justify-between py-2.5 text-[13px]',
                i > 0 && 'border-t border-border/30'
              )}
            >
              <span className="font-medium text-text-2 truncate pr-2">{it.name}</span>
              <span className={cn('font-bold tabular-nums', style.qtyColor)}>
                {it.quantity !== null ? formatNumber(it.quantity) : '—'}
              </span>
            </div>
          ))}
          {items.length > preview.length && (
            <button
              onClick={onOpen}
              className="text-[11px] text-text-3 hover:text-text font-semibold pt-2 mt-1 border-t border-border/30 text-left"
            >
              +{items.length - preview.length} kayıt daha…
            </button>
          )}
        </div>
      ) : (
        <p className="text-[12px] text-text-3 italic text-center py-4">Kayıt seçilmedi</p>
      )}
    </div>
  );
};

const CategoryDetailModal: React.FC<{
  category: string;
  items: LabItem[];
  history: LabHistory[];
  onClose: () => void;
}> = ({ category, items, history, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      it.name.toLowerCase().includes(q) ||
      (it.cas ?? '').toLowerCase().includes(q) ||
      (it.model ?? '').toLowerCase().includes(q) ||
      (it.serial ?? '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const selected = items.find((it) => it.id === selectedId) ?? items[0];
  const itemHistory = useMemo(
    () => selected ? history.filter((h) => h.inventory_item_id === selected.id).slice(0, 20) : [],
    [history, selected]
  );

  const isChem = selected ? isChemicalCategory(selected.category) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', styleFor(category).iconBg, styleFor(category).iconColor)}>
              {styleFor(category).icon}
            </div>
            <div className="min-w-0">
              <h2 className="text-[18px] font-black text-text leading-tight">{category}</h2>
              <p className="text-[11px] text-text-3 font-semibold">{items.length} kayıt</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-2 text-text-3" title="Kapat">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr] overflow-hidden">
          {/* List */}
          <div className="border-r border-border/40 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border/40">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ad, CAS, model, seri..."
                  className="w-full pl-9 pr-3 py-2 text-[12px] rounded-lg bg-surface-2 border border-border/40 focus:outline-none focus:border-border"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="p-4 text-[12px] text-text-3 italic">Eşleşen yok.</p>
              ) : (
                filtered.map((it) => {
                  const lowOrOut = isOutOfStock(it) || isLowStock(it);
                  return (
                    <button
                      key={it.id}
                      onClick={() => setSelectedId(it.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 border-b border-border/30 hover:bg-surface-2',
                        selected?.id === it.id && 'bg-surface-2'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-bold text-text truncate">{it.name}</span>
                        {lowOrOut && (
                          <span className={cn(
                            'shrink-0 w-1.5 h-1.5 rounded-full',
                            isOutOfStock(it) ? 'bg-red-500' : 'bg-amber-500'
                          )} />
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-text-3 truncate">{it.location ?? '—'}</span>
                        <span className="text-[11px] font-bold text-text-2 tabular-nums">
                          {it.quantity !== null ? formatNumber(it.quantity) : '—'} {it.unit ?? ''}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Detail */}
          <div className="p-6 overflow-y-auto">
            {!selected ? (
              <p className="text-[13px] text-text-3 italic">Soldan bir kayıt seç.</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[22px] font-black text-text leading-tight">{selected.name}</h3>
                  <p className="text-[11px] text-text-3 uppercase tracking-widest font-semibold mt-1">{selected.category}</p>
                </div>

                {/* Quantity headline */}
                <div className="flex items-end gap-3 pb-4 border-b border-border/40">
                  <span className={cn(
                    'text-[36px] font-black leading-none',
                    isOutOfStock(selected) ? 'text-red-500' : isLowStock(selected) ? 'text-amber-500' : 'text-text'
                  )}>
                    {selected.quantity !== null ? formatNumber(selected.quantity) : '—'}
                  </span>
                  <span className="text-[14px] text-text-3 font-bold pb-1">{selected.unit ?? ''}</span>
                  {selected.min_stock !== null && (
                    <span className="ml-auto text-[11px] text-text-3 pb-1">
                      Min: {formatNumber(selected.min_stock)}{selected.unit ? ` ${selected.unit}` : ''}
                    </span>
                  )}
                </div>

                {/* Fields */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selected.location && <DetailField label="Konum" value={selected.location} />}
                  {isChem ? (
                    <>
                      {selected.cas && <DetailField label="CAS" value={selected.cas} />}
                      {selected.purity && <DetailField label="Saflık" value={selected.purity} />}
                      {selected.chem_type && <DetailField label="Tip" value={selected.chem_type} />}
                      {selected.storage && <DetailField label="Depolama" value={selected.storage} />}
                      {selected.color && <DetailField label="Renk" value={selected.color} />}
                      {selected.appearance && <DetailField label="Görünüm" value={selected.appearance} />}
                      {selected.synthesis_date && <DetailField label="Sentez Tarihi" value={formatTR(selected.synthesis_date)} />}
                      {selected.mof_yield && <DetailField label="Verim" value={selected.mof_yield} />}
                    </>
                  ) : (
                    <>
                      {selected.model && <DetailField label="Model" value={selected.model} />}
                      {selected.serial && <DetailField label="Seri No" value={selected.serial} />}
                      {selected.appearance && <DetailField label="Görünüm" value={selected.appearance} />}
                    </>
                  )}
                </div>

                {selected.hazards && selected.hazards.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-text-3 font-semibold">Tehlikeler</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {selected.hazards.map((h) => (
                        <span key={h} className="px-2 py-1 rounded bg-rose-50 text-rose-700 text-[11px] font-bold uppercase">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.notes && (
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-text-3 font-semibold">Notlar</span>
                    <p className="text-[13px] text-text-2 mt-2 whitespace-pre-line">{selected.notes}</p>
                  </div>
                )}

                {/* History */}
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-text-3 font-semibold">Hareket Geçmişi</span>
                  {itemHistory.length === 0 ? (
                    <p className="text-[12px] text-text-3 italic mt-2">Hareket yok.</p>
                  ) : (
                    <div className="mt-2 space-y-1">
                      {itemHistory.map((h) => (
                        <div key={h.id} className="flex items-start gap-3 py-2 border-b border-border/30 text-[12px]">
                          <span className="text-text-3 tabular-nums shrink-0 w-24">
                            {formatTR(h.date.slice(0, 10))}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-text-2 capitalize">{h.action}</span>
                            {h.detail && <span className="text-text-3"> — {h.detail}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

