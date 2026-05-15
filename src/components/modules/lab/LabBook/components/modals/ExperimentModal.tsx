import React, { useState } from 'react';
import { RotateCw, Scale, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../../../../../lib/utils';
import { usePortalUsers } from '../../../../../../lib/users';
import { useLabBook } from '../../context';
import { SUB_TYPE_DETAIL_LABEL, SUB_TYPE_LABEL } from '../../types';
import type { Experiment, SubExperimentType } from '../../types';
import { ModalShell, FormField, inputClass } from './ModalShell';

interface Props {
  mode:             'add' | 'edit';
  mofCategoryId:    string;
  shapingVariantId?: string | null;     // dolu ise şekillendirme deneyi
  parent?:          Experiment | null;
  experiment?:      Experiment;
  currentUserId:    string;
  onClose:          () => void;
  onCreated?:       (exp: Experiment) => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const SUB_TYPE_ORDER: SubExperimentType[] = ['repeat', 'scale_up', 'parameter'];
const SUB_TYPE_ICON: Record<SubExperimentType, React.ComponentType<{ size?: number; className?: string }>> = {
  repeat:    RotateCw,
  scale_up:  Scale,
  parameter: SlidersHorizontal,
};

export const ExperimentModal: React.FC<Props> = ({
  mode, mofCategoryId, shapingVariantId, parent, experiment, currentUserId, onClose, onCreated,
}) => {
  const { mof: { addExperiment, updateExperiment, categories, variants } } = useLabBook();
  const { users } = usePortalUsers();

  const isSub = Boolean(parent) || Boolean(experiment?.parentId);
  const mofName = categories.find((c) => c.id === mofCategoryId)?.name ?? '';
  const effectiveShapingVariantId = shapingVariantId ?? parent?.shapingVariantId ?? experiment?.shapingVariantId ?? null;
  const variantName = effectiveShapingVariantId
    ? variants.find((v) => v.id === effectiveShapingVariantId)?.name ?? ''
    : '';

  // edit mode'da deneyin mevcut subType'ı kilitli; add'de varsayılan 'repeat'
  const initialSubType: SubExperimentType =
    experiment?.subType ?? (isSub ? 'repeat' : 'repeat'); // 'repeat' yalnızca isSub true ise UI'da kullanılır

  // ── State ────────────────────────────────────────────────────────────────
  const [subType,        setSubType]        = useState<SubExperimentType>(initialSubType);
  const [title,          setTitle]          = useState(experiment?.title ?? '');
  const [batchNo,        setBatchNo]        = useState(experiment?.batchNo ?? '');
  const [referenceUrl,   setReferenceUrl]   = useState(experiment?.referenceUrl ?? '');
  const [authorId,       setAuthorId]       = useState(experiment?.authorId ?? currentUserId);
  const [date,           setDate]           = useState(experiment?.experimentDate ?? todayISO());
  const [yieldPct,       setYieldPct]       = useState(experiment?.yieldPct?.toString() ?? '');
  const [amount,         setAmount]         = useState(experiment?.amount ?? '');
  const [repeatReason,   setRepeatReason]   = useState(experiment?.repeatReason ?? '');
  const [scaleUpDetail,  setScaleUpDetail]  = useState(experiment?.scaleUpDetail ?? '');
  const [parameterDetail,setParameterDetail]= useState(experiment?.parameterDetail ?? '');
  const [submitting,     setSubmitting]     = useState(false);

  const parseNum = (v: string): number | null => {
    if (!v.trim()) return null;
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !batchNo.trim()) return;
    setSubmitting(true);

    if (mode === 'add') {
      // shapingVariantId: explicit prop > parent'tan miras > null
      const finalShapingVariantId = shapingVariantId ?? parent?.shapingVariantId ?? null;
      const created = await addExperiment({
        mofCategoryId,
        shapingVariantId: finalShapingVariantId,
        parentId: parent?.id ?? null,
        subType:  isSub ? subType : null,
        title,
        batchNo,
        referenceUrl: referenceUrl || null,
        authorLegacyId: authorId || null,
        experimentDate: date,
        yieldPct: parseNum(yieldPct),
        amount: amount || null,
        repeatReason:    isSub && subType === 'repeat'    ? repeatReason    || null : null,
        scaleUpDetail:   isSub && subType === 'scale_up'  ? scaleUpDetail   || null : null,
        parameterDetail: isSub && subType === 'parameter' ? parameterDetail || null : null,
      });
      if (created && onCreated) onCreated(created);
    } else if (experiment) {
      // Edit: subType değiştirilemez, sadece üst meta alanları
      const currentSub = experiment.subType;
      await updateExperiment(experiment.id, {
        title,
        batchNo,
        referenceUrl: referenceUrl || null,
        authorLegacyId: authorId || null,
        experimentDate: date,
        yieldPct: parseNum(yieldPct),
        amount: amount || null,
        repeatReason:    currentSub === 'repeat'    ? repeatReason    || null : undefined,
        scaleUpDetail:   currentSub === 'scale_up'  ? scaleUpDetail   || null : undefined,
        parameterDetail: currentSub === 'parameter' ? parameterDetail || null : undefined,
      });
    }
    setSubmitting(false);
    onClose();
  };

  // Üst etiket
  const prefix = variantName ? `${mofName} · ${variantName.toUpperCase()}` : mofName;
  const breadcrumb = isSub && parent
    ? `${prefix} · ${parent.title.toUpperCase()} ALTINDA`
    : (isSub && experiment?.parentId)
      ? `${prefix} · DÜZENLE`
      : prefix;

  const editLockedSubType = mode === 'edit' && experiment?.subType;

  return (
    <ModalShell
      breadcrumb={breadcrumb}
      title={mode === 'add' ? 'Yeni Deney Kaydı' : 'Deneyi Düzenle'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel={mode === 'add' ? 'Deneyi Oluştur' : 'Kaydet'}
      maxWidth="max-w-xl"
    >
      {/* Alt deney türü toggle (sadece sub-experiment'larda) */}
      {isSub && (
        <FormField label="Alt Deney Türü" required>
          <div className="grid grid-cols-3 gap-2">
            {SUB_TYPE_ORDER.map((t) => {
              const Icon = SUB_TYPE_ICON[t];
              const isActive = subType === t;
              const locked = Boolean(editLockedSubType) && experiment?.subType !== t;
              return (
                <button
                  key={t}
                  type="button"
                  disabled={locked}
                  onClick={() => !locked && setSubType(t)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 px-2 py-3 text-[11.5px] font-semibold rounded-lg border-2 transition-all',
                    isActive
                      ? 'bg-[#BA7517] border-[#BA7517] text-white'
                      : 'bg-white border-[#cdc4ad] text-[#5a5240] hover:border-[#a89b78]',
                    locked && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <Icon size={18} />
                  {SUB_TYPE_LABEL[t]}
                </button>
              );
            })}
          </div>
        </FormField>
      )}

      <FormField label="Deney Adı" required>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Örn. Metanol'de CALF-20 sentezi - %75 verim"
          className={inputClass}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Deney Tarihi" required>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${inputClass} font-mono`}
          />
        </FormField>
        <FormField label="Deney Sahibi" required>
          <select value={authorId} onChange={(e) => setAuthorId(e.target.value)} className={inputClass}>
            <option value="">—</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </FormField>
      </div>

      <FormField label="Batch No" required>
        <input
          value={batchNo}
          onChange={(e) => setBatchNo(e.target.value)}
          placeholder="HLS-2026-001 veya CF-Zn-1"
          className={`${inputClass} font-mono`}
        />
      </FormField>

      <FormField label="Referans Makale (Drive)">
        <input
          type="url"
          value={referenceUrl}
          onChange={(e) => setReferenceUrl(e.target.value)}
          placeholder="https://drive.google.com/..."
          className={inputClass}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Verim (opsiyonel)">
          <input
            value={yieldPct}
            onChange={(e) => setYieldPct(e.target.value)}
            placeholder="Örn. %75"
            className={`${inputClass} font-mono`}
          />
        </FormField>
        <FormField label="Elde Edilen Miktar (opsiyonel)">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Örn. 1.2 g"
            className={inputClass}
          />
        </FormField>
      </div>

      {/* Türe özel alan */}
      {isSub && (subType === 'repeat' || (editLockedSubType === 'repeat')) && (
        <FormField label={SUB_TYPE_DETAIL_LABEL.repeat}>
          <input
            value={repeatReason}
            onChange={(e) => setRepeatReason(e.target.value)}
            placeholder="Örn. Reproducibility kontrolü"
            className={inputClass}
          />
        </FormField>
      )}
      {isSub && (subType === 'scale_up' || (editLockedSubType === 'scale_up')) && (
        <FormField label={SUB_TYPE_DETAIL_LABEL.scale_up}>
          <input
            value={scaleUpDetail}
            onChange={(e) => setScaleUpDetail(e.target.value)}
            placeholder="Örn. 50g → 500g ölçek"
            className={inputClass}
          />
        </FormField>
      )}
      {isSub && (subType === 'parameter' || (editLockedSubType === 'parameter')) && (
        <FormField label={SUB_TYPE_DETAIL_LABEL.parameter}>
          <input
            value={parameterDetail}
            onChange={(e) => setParameterDetail(e.target.value)}
            placeholder="Örn. Sıcaklık 120°C → 110°C"
            className={inputClass}
          />
        </FormField>
      )}
    </ModalShell>
  );
};
