import { useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { TYPE_META, TYPE_ORDER, MAX_FILE_SIZE } from './constants';
import { fileToAttachment, formatBytes } from './utils';
import type {
  PurchaseAttachment,
  PurchaseAuthor,
  PurchaseDetails,
  PurchaseRequest,
  PurchaseType,
  StorageKind,
  Urgency,
} from './types';

export type NewPurchaseInput = Omit<
  PurchaseRequest,
  'id' | 'createdAt' | 'createdBy' | 'status'
>;

interface Props {
  onSubmit: (input: NewPurchaseInput) => void;
  onCancel: () => void;
  assigneeCandidates: PurchaseAuthor[];
}

const blankDetails = (type: PurchaseType): PurchaseDetails => {
  switch (type) {
    case 'kimyasal':
      return { kind: 'kimyasal', cas: '', purity: '', manufacturer: '', storage: '' };
    case 'sarf':
      return { kind: 'sarf', brandModel: '', supplier: '' };
    case 'ekipman':
      return { kind: 'ekipman', brandModel: '', supplier: '', warrantyMonths: '' };
    case 'ariza':
      return { kind: 'ariza', device: '', detectedAt: '', faultType: '' };
    case 'hizmet':
      return { kind: 'hizmet', serviceType: '', company: '', invoiceNo: '', invoiceDate: '' };
    case 'diger':
      return { kind: 'diger' };
  }
};

const inputCls =
  'w-full p-3 bg-surface border border-border rounded-lg outline-none focus:border-text transition-all text-[13px]';

const labelCls = 'text-[12px] font-bold text-text-3';

export const PurchaseForm: React.FC<Props> = ({ onSubmit, onCancel, assigneeCandidates }) => {
  const [type, setType] = useState<PurchaseType>('kimyasal');
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('normal');
  const [quantity, setQuantity] = useState('');
  const [attachment, setAttachment] = useState<PurchaseAttachment | undefined>();
  const [fileError, setFileError] = useState<string | null>(null);
  const [details, setDetails] = useState<PurchaseDetails>(() => blankDetails('kimyasal'));
  const [assigneeId, setAssigneeId] = useState<string>(() => assigneeCandidates[0]?.id ?? '');
  const [assigneeError, setAssigneeError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTypeChange = (next: PurchaseType) => {
    setType(next);
    setDetails(blankDetails(next));
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`Dosya 5MB sınırını aşıyor (${formatBytes(file.size)}).`);
      e.target.value = '';
      return;
    }
    try {
      const att = await fileToAttachment(file);
      setAttachment(att);
      setFileError(null);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Dosya okunamadı.');
    } finally {
      e.target.value = '';
    }
  };

  const removeAttachment = () => {
    setAttachment(undefined);
    setFileError(null);
  };

  const handleSubmit = () => {
    let invalid = false;
    if (!title.trim()) {
      setTitleError(true);
      invalid = true;
    } else {
      setTitleError(false);
    }
    const assignee = assigneeCandidates.find((u) => u.id === assigneeId);
    if (!assignee) {
      setAssigneeError(true);
      invalid = true;
    } else {
      setAssigneeError(false);
    }
    if (invalid || !assignee) return;
    onSubmit({
      type,
      title: title.trim(),
      description: description.trim(),
      link: link.trim() || undefined,
      estimatedPrice: estimatedPrice.trim() || undefined,
      urgency,
      quantity: quantity.trim() || undefined,
      attachment,
      details,
      assignedTo: assignee,
    });
  };

  const updateDetails = (patch: Record<string, unknown>) => {
    setDetails((prev) => ({ ...prev, ...patch } as PurchaseDetails));
  };

  return (
    <div className="bg-surface-2/60 border-[0.5px] border-border rounded-2xl p-6 md:p-7 space-y-6">
      {/* TÜR */}
      <div className="space-y-3">
        <div className={labelCls}>TÜR</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {TYPE_ORDER.map((t) => {
            const meta = TYPE_META[t];
            const Icon = meta.icon;
            const active = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-lg border transition-all text-[12px] font-semibold',
                  active
                    ? 'bg-text text-white border-text shadow-sm'
                    : 'bg-surface text-text-2 border-border hover:border-text/30 hover:text-text'
                )}
              >
                <Icon size={18} className={active ? '' : 'opacity-70'} />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Başlık */}
      <div className="space-y-1.5">
        <label className={labelCls}>
          Başlık <span className="text-red-text">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError) setTitleError(false);
          }}
          placeholder="Örn: 1,2,4-Triazol"
          className={cn(inputCls, titleError && 'border-red-border')}
        />
      </div>

      {/* Açıklama */}
      <div className="space-y-1.5">
        <label className={labelCls}>Açıklama / gerekçe</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Neden lazım, hangi proje için, aciliyet durumu..."
          className={cn(inputCls, 'resize-y min-h-20')}
        />
      </div>

      {/* Link + Fiyat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={labelCls}>Link (opsiyonel)</label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Sigma-Aldrich, Merck, trendyol vs."
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Tahmini fiyat</label>
          <input
            type="text"
            value={estimatedPrice}
            onChange={(e) => setEstimatedPrice(e.target.value)}
            placeholder="Örn: 1.200 TL"
            className={inputCls}
          />
        </div>
      </div>

      {/* Aciliyet + Miktar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className={labelCls}>Aciliyet</label>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as Urgency)}
            className={inputCls}
          >
            <option value="normal">Normal</option>
            <option value="yuksek">Yüksek</option>
            <option value="acil">Acil</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Miktar / adet</label>
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Örn: 100 g, 5 adet"
            className={inputCls}
          />
        </div>
      </div>

      {/* Atanan kişi */}
      <div className="space-y-1.5">
        <label className={labelCls}>
          Atanan kişi <span className="text-red-text">*</span>
        </label>
        {assigneeCandidates.length === 0 ? (
          <div className="text-[12px] text-red-text bg-red-bg/60 border border-red-border/30 rounded-lg p-3">
            Satın alma sorumlusu atanmamış. Yönetici, Kullanıcılar modülünden ilgili kişilere "Satın alma sorumlusu" yetkisini vermelidir.
          </div>
        ) : (
          <select
            value={assigneeId}
            onChange={(e) => {
              setAssigneeId(e.target.value);
              if (assigneeError) setAssigneeError(false);
            }}
            className={cn(inputCls, assigneeError && 'border-red-border')}
          >
            {assigneeCandidates.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}
        <p className="text-[11px] text-text-3">Talep, atanan kişiye bildirim olarak iletilir; durumu yalnızca o (veya yönetici) güncelleyebilir.</p>
      </div>

      {/* Dosya */}
      <div className="space-y-1.5">
        <label className={labelCls}>Dosya / proforma (opsiyonel)</label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-[13px] font-semibold text-text-2 hover:border-text/30 hover:text-text transition-all"
          >
            <Upload size={14} />
            Dosya seç
          </button>
          {attachment ? (
            <span className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-[12px] text-text-2">
              <FileText size={13} className="opacity-60" />
              <span className="font-medium">{attachment.name}</span>
              <span className="text-text-3">· {formatBytes(attachment.size)}</span>
              <button
                type="button"
                onClick={removeAttachment}
                className="ml-1 text-text-3 hover:text-red-text"
                aria-label="Dosyayı kaldır"
              >
                <X size={12} />
              </button>
            </span>
          ) : (
            <span className="text-[12px] text-text-3">Dosya seçilmedi</span>
          )}
        </div>
        <p className={cn('text-[11px]', fileError ? 'text-red-text' : 'text-text-3')}>
          {fileError ?? 'Proforma, teklif, fatura, dekont · PDF/JPG/PNG · maks 5MB'}
        </p>
      </div>

      {/* Tür-bazlı detaylar */}
      {details.kind === 'kimyasal' && (
        <div className="space-y-3 pt-2 border-t border-border">
          <div className={cn(labelCls, 'pt-2')}>KİMYASAL BİLGİLERİ</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>CAS numarası</label>
              <input
                type="text"
                value={details.cas ?? ''}
                onChange={(e) => updateDetails({ kind: 'kimyasal', cas: e.target.value })}
                placeholder="Örn: 288-88-0"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Saflık</label>
              <input
                type="text"
                value={details.purity ?? ''}
                onChange={(e) => updateDetails({ kind: 'kimyasal', purity: e.target.value })}
                placeholder="Örn: ≥99%"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Üretici / kod</label>
              <input
                type="text"
                value={details.manufacturer ?? ''}
                onChange={(e) => updateDetails({ kind: 'kimyasal', manufacturer: e.target.value })}
                placeholder="Örn: Sigma T54406"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Özel saklama</label>
              <select
                value={details.storage ?? ''}
                onChange={(e) =>
                  updateDetails({ kind: 'kimyasal', storage: e.target.value as StorageKind })
                }
                className={inputCls}
              >
                <option value="">—</option>
                <option value="oda">Oda sıcaklığı</option>
                <option value="4c">+4 °C</option>
                <option value="-20c">-20 °C</option>
                <option value="-80c">-80 °C</option>
                <option value="yanici">Yanıcı kabin</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {details.kind === 'sarf' && (
        <div className="space-y-3 pt-2 border-t border-border">
          <div className={cn(labelCls, 'pt-2')}>SARF DETAYI</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Marka / model</label>
              <input
                type="text"
                value={details.brandModel ?? ''}
                onChange={(e) => updateDetails({ kind: 'sarf', brandModel: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Tedarikçi</label>
              <input
                type="text"
                value={details.supplier ?? ''}
                onChange={(e) => updateDetails({ kind: 'sarf', supplier: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )}

      {details.kind === 'ekipman' && (
        <div className="space-y-3 pt-2 border-t border-border">
          <div className={cn(labelCls, 'pt-2')}>EKİPMAN DETAYI</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Marka / model</label>
              <input
                type="text"
                value={details.brandModel ?? ''}
                onChange={(e) => updateDetails({ kind: 'ekipman', brandModel: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Tedarikçi</label>
              <input
                type="text"
                value={details.supplier ?? ''}
                onChange={(e) => updateDetails({ kind: 'ekipman', supplier: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className={labelCls}>Garanti süresi (ay)</label>
              <input
                type="text"
                value={details.warrantyMonths ?? ''}
                onChange={(e) => updateDetails({ kind: 'ekipman', warrantyMonths: e.target.value })}
                placeholder="Örn: 24"
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )}

      {details.kind === 'ariza' && (
        <div className="space-y-3 pt-2 border-t border-border">
          <div className={cn(labelCls, 'pt-2')}>ARIZA DETAYI</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Cihaz</label>
              <input
                type="text"
                value={details.device ?? ''}
                onChange={(e) => updateDetails({ kind: 'ariza', device: e.target.value })}
                placeholder="Örn: Santrifüj"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Tespit tarihi</label>
              <input
                type="date"
                value={details.detectedAt ?? ''}
                onChange={(e) => updateDetails({ kind: 'ariza', detectedAt: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className={labelCls}>Parça / arıza türü</label>
              <input
                type="text"
                value={details.faultType ?? ''}
                onChange={(e) => updateDetails({ kind: 'ariza', faultType: e.target.value })}
                placeholder="Örn: Kapak kilit mekanizması"
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )}

      {details.kind === 'hizmet' && (
        <div className="space-y-3 pt-2 border-t border-border">
          <div className={cn(labelCls, 'pt-2')}>HİZMET / ÖDEME DETAYI</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Hizmet türü</label>
              <input
                type="text"
                value={details.serviceType ?? ''}
                onChange={(e) => updateDetails({ kind: 'hizmet', serviceType: e.target.value })}
                placeholder="Örn: Analiz / karakterizasyon"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Firma</label>
              <input
                type="text"
                value={details.company ?? ''}
                onChange={(e) => updateDetails({ kind: 'hizmet', company: e.target.value })}
                placeholder="Örn: BOUN SEM-TEM Lab"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Fatura no</label>
              <input
                type="text"
                value={details.invoiceNo ?? ''}
                onChange={(e) => updateDetails({ kind: 'hizmet', invoiceNo: e.target.value })}
                placeholder="Örn: FT-2026-0451"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Fatura tarihi</label>
              <input
                type="date"
                value={details.invoiceDate ?? ''}
                onChange={(e) => updateDetails({ kind: 'hizmet', invoiceDate: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-[13px] font-semibold text-text-2 hover:bg-surface rounded-lg transition-all"
        >
          Vazgeç
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-5 py-2.5 bg-text text-white text-[13px] font-semibold rounded-lg hover:bg-black/85 transition-all shadow-sm active:scale-95"
        >
          Talep oluştur
        </button>
      </div>
    </div>
  );
};
