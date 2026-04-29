import { FileText, Lock, UserCheck } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { STATUS_META, STATUS_ORDER, STORAGE_LABEL, TYPE_META } from './constants';
import { formatShortDate } from './utils';
import type { PurchaseRequest, PurchaseStatus } from './types';
import { downloadFromBucket } from '../../../../lib/storage';

interface Props {
  purchase: PurchaseRequest;
  canManage: boolean;
  highlighted?: boolean;
  onStatusChange: (id: string, status: PurchaseStatus) => void;
  onDelete: (id: string) => void;
}

interface MetaItem {
  label: string;
  value: string;
}

const detailItems = (p: PurchaseRequest): MetaItem[] => {
  const items: MetaItem[] = [];
  if (p.quantity) items.push({ label: 'Miktar', value: p.quantity });

  switch (p.details?.kind) {
    case 'kimyasal': {
      const d = p.details;
      if (d.cas) items.push({ label: 'CAS', value: d.cas });
      if (d.purity) items.push({ label: 'Saflık', value: d.purity });
      if (d.manufacturer) items.push({ label: 'Üretici', value: d.manufacturer });
      if (d.storage) items.push({ label: 'Saklama', value: STORAGE_LABEL[d.storage] });
      if (p.estimatedPrice) items.push({ label: 'Fiyat', value: p.estimatedPrice });
      break;
    }
    case 'sarf':
    case 'ekipman': {
      const d = p.details;
      if (p.estimatedPrice) items.push({ label: 'Fiyat', value: p.estimatedPrice });
      if (d.brandModel) items.push({ label: 'Marka', value: d.brandModel });
      if (d.supplier) items.push({ label: 'Tedarikçi', value: d.supplier });
      if (d.kind === 'ekipman' && d.warrantyMonths) {
        items.push({ label: 'Garanti', value: `${d.warrantyMonths} ay` });
      }
      break;
    }
    case 'ariza': {
      const d = p.details;
      if (d.device) items.push({ label: 'Cihaz', value: d.device });
      if (d.detectedAt) items.push({ label: 'Tespit', value: d.detectedAt });
      if (d.faultType) items.push({ label: 'Arıza', value: d.faultType });
      break;
    }
    case 'hizmet': {
      const d = p.details;
      if (p.estimatedPrice) items.push({ label: 'Fiyat', value: p.estimatedPrice });
      if (d.serviceType) items.push({ label: 'Hizmet', value: d.serviceType });
      if (d.company) items.push({ label: 'Firma', value: d.company });
      if (d.invoiceNo) items.push({ label: 'Fatura', value: d.invoiceNo });
      if (d.invoiceDate) items.push({ label: 'Tarih', value: d.invoiceDate });
      break;
    }
    case 'diger':
    default: {
      if (p.estimatedPrice) items.push({ label: 'Fiyat', value: p.estimatedPrice });
      if (p.link) items.push({ label: 'Link', value: p.link });
      break;
    }
  }
  return items;
};

export const PurchaseCard: React.FC<Props> = ({
  purchase,
  canManage,
  highlighted,
  onStatusChange,
  onDelete,
}) => {
  const typeMeta = TYPE_META[purchase.type];
  const meta = detailItems(purchase);
  const statusMeta = STATUS_META[purchase.status];

  const openAttachment = async () => {
    if (!purchase.attachment) return;
    // Hooks içinde attachment.dataUrl alanına storage path yazıyoruz
    const path = purchase.attachment.dataUrl;
    const result = await downloadFromBucket('purchase-attachments', path, purchase.attachment.name);
    if (!result.ok) {
      window.alert('Dosya indirilemedi:\n' + (result.error ?? 'bilinmeyen hata'));
    }
  };

  return (
    <div
      data-purchase-id={purchase.id}
      className={cn(
        'group bg-surface border-[0.5px] border-border rounded-2xl p-5 transition-all hover:border-text/20 hover:shadow-sm border-l-4',
        typeMeta.border,
        highlighted && 'ring-2 ring-info-border shadow-md'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
              typeMeta.badge,
              typeMeta.badgeText
            )}
          >
            {typeMeta.label}
          </span>
          {purchase.urgency === 'acil' && (
            <span className="text-[9px] font-extrabold uppercase tracking-widest bg-red-bg text-red-text px-2 py-0.5 rounded animate-pulse">
              Acil
            </span>
          )}
          {purchase.urgency === 'yuksek' && (
            <span className="text-[9px] font-extrabold uppercase tracking-widest bg-amber-bg text-amber-text px-2 py-0.5 rounded">
              Yüksek
            </span>
          )}
          <h4 className="text-[15px] font-semibold text-text">{purchase.title}</h4>
        </div>
        {canManage && (
          <button
            onClick={() => onDelete(purchase.id)}
            className="text-[12px] text-text-3 hover:text-red-text transition-colors shrink-0"
          >
            sil
          </button>
        )}
      </div>

      {purchase.description && (
        <p className="text-[13px] text-text-2 leading-relaxed mt-1.5">{purchase.description}</p>
      )}

      {meta.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-text-3 font-medium mt-3 font-mono">
          {meta.map((m, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="text-text-3/70">{m.label}:</span>
              <span className="text-text-2">{m.value}</span>
            </span>
          ))}
        </div>
      )}

      {purchase.attachment && (
        <button
          type="button"
          onClick={openAttachment}
          className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-[12px] font-medium text-text-2 hover:border-text/30 hover:text-text transition-all"
        >
          <FileText size={13} className="opacity-60" />
          {purchase.attachment.name}
        </button>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-border">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-text-3 font-medium">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                purchase.createdBy.color
              )}
            >
              {purchase.createdBy.initials}
            </div>
            <span className="text-text-2">{purchase.createdBy.name}</span>
            <span className="text-text-3">·</span>
            <span>{formatShortDate(purchase.createdAt)}</span>
          </div>

          {purchase.assignedTo && (
            <div className="flex items-center gap-1.5 pl-3 border-l border-border">
              <UserCheck size={12} className="text-text-3" />
              <span className="text-text-3">Atanan:</span>
              <div
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold',
                  purchase.assignedTo.color
                )}
              >
                {purchase.assignedTo.initials}
              </div>
              <span className="text-text-2">{purchase.assignedTo.name}</span>
            </div>
          )}
        </div>

        {canManage ? (
          <div className={cn('relative rounded-lg', statusMeta.pill)}>
            <select
              value={purchase.status}
              onChange={(e) => onStatusChange(purchase.id, e.target.value as PurchaseStatus)}
              className={cn(
                'appearance-none bg-transparent pl-3 pr-7 py-1.5 text-[12px] font-semibold rounded-lg outline-none cursor-pointer',
                statusMeta.pill
              )}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px]">▾</span>
          </div>
        ) : (
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold',
              statusMeta.pill
            )}
            title="Durumu yalnızca atanan kişi veya yönetici güncelleyebilir."
          >
            <Lock size={11} className="opacity-60" />
            {statusMeta.label}
          </div>
        )}
      </div>
    </div>
  );
};
