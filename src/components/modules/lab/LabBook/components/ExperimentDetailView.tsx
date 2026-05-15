import React, { useEffect, useState } from 'react';
import {
  FileText, Plus, Pencil, Trash2, ArrowUpRight, ExternalLink, Check, X,
  FlaskConical, RotateCw, Scale, SlidersHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { confirmAction } from '../../../../../lib/confirm';
import { getCachedUsers, usePortalUsers } from '../../../../../lib/users';
import { useLabBook } from '../context';
import { SUB_TYPE_DETAIL_LABEL, SUB_TYPE_LABEL, formatDateShort } from '../types';
import type { Experiment, SubExperimentType } from '../types';
import { MarkdownSection } from './MarkdownSection';
import { MaterialsTable } from './MaterialsTable';
import { CharacterizationList } from './CharacterizationList';
import { exportExperimentPdf } from '../pdfExport';

const SUB_ICONS: Record<SubExperimentType, LucideIcon> = {
  repeat:    RotateCw,
  scale_up:  Scale,
  parameter: SlidersHorizontal,
};

interface Props {
  experiment:    Experiment;
  onAddChild:    (parent: Experiment) => void;
  onSelectParent:(parentId: string) => void;
}

export const ExperimentDetailView: React.FC<Props> = ({
  experiment, onAddChild, onSelectParent,
}) => {
  const {
    user,
    mof: { categories, experiments, materials, characterizations, updateExperiment, deleteExperiment },
    setMofTabSelectedExperimentId,
  } = useLabBook();
  const { users } = usePortalUsers();

  const category = categories.find((c) => c.id === experiment.mofCategoryId);
  const parent = (experiment.parentId ? experiments.find((e) => e.id === experiment.parentId) : null) ?? null;
  const children = experiments.filter((e) => e.parentId === experiment.id);

  const portalUsers = getCachedUsers();
  const authorName = experiment.authorId
    ? portalUsers.find((u) => u.id === experiment.authorId)?.name ?? experiment.authorId
    : '—';

  const TypeIcon = experiment.subType ? SUB_ICONS[experiment.subType] : FlaskConical;

  // ── Inline edit state ────────────────────────────────────────────────────
  const [isEditing,    setIsEditing]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [justSaved,    setJustSaved]    = useState(false);
  const [editTitle,    setEditTitle]    = useState(experiment.title);
  const [editBatchNo,  setEditBatchNo]  = useState(experiment.batchNo);
  const [editAuthorId, setEditAuthorId] = useState(experiment.authorId ?? '');
  const [editDate,     setEditDate]     = useState(experiment.experimentDate);
  const [editRefUrl,   setEditRefUrl]   = useState(experiment.referenceUrl ?? '');
  const [editYieldPct, setEditYieldPct] = useState(experiment.yieldPct?.toString() ?? '');
  const [editAmount,   setEditAmount]   = useState(experiment.amount ?? '');
  const [editRepeatReason,    setEditRepeatReason]    = useState(experiment.repeatReason ?? '');
  const [editScaleUpDetail,   setEditScaleUpDetail]   = useState(experiment.scaleUpDetail ?? '');
  const [editParameterDetail, setEditParameterDetail] = useState(experiment.parameterDetail ?? '');
  // Markdown bölümler — edit modunda parent'tan kontrol edilir
  const [editGeneralOverview,    setEditGeneralOverview]    = useState(experiment.generalOverview ?? '');
  const [editReasonDiff,         setEditReasonDiff]         = useState(experiment.reasonDiff ?? '');
  const [editProcedureEquipment, setEditProcedureEquipment] = useState(experiment.procedureEquipment ?? '');
  const [editPlanResults,        setEditPlanResults]        = useState(experiment.planResults ?? '');

  // Experiment değişirse (sidebar'da başka deneye geçildi) edit modunu kapat ve değerleri tazele
  useEffect(() => {
    setIsEditing(false);
    setJustSaved(false);
    setEditTitle(experiment.title);
    setEditBatchNo(experiment.batchNo);
    setEditAuthorId(experiment.authorId ?? '');
    setEditDate(experiment.experimentDate);
    setEditRefUrl(experiment.referenceUrl ?? '');
    setEditYieldPct(experiment.yieldPct?.toString() ?? '');
    setEditAmount(experiment.amount ?? '');
    setEditRepeatReason(experiment.repeatReason ?? '');
    setEditScaleUpDetail(experiment.scaleUpDetail ?? '');
    setEditParameterDetail(experiment.parameterDetail ?? '');
    setEditGeneralOverview(experiment.generalOverview ?? '');
    setEditReasonDiff(experiment.reasonDiff ?? '');
    setEditProcedureEquipment(experiment.procedureEquipment ?? '');
    setEditPlanResults(experiment.planResults ?? '');
  }, [experiment.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const parseNum = (v: string): number | null => {
    if (!v.trim()) return null;
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };

  const enterEdit = () => {
    // Mevcut değerlerden başla
    setEditTitle(experiment.title);
    setEditBatchNo(experiment.batchNo);
    setEditAuthorId(experiment.authorId ?? '');
    setEditDate(experiment.experimentDate);
    setEditRefUrl(experiment.referenceUrl ?? '');
    setEditYieldPct(experiment.yieldPct?.toString() ?? '');
    setEditAmount(experiment.amount ?? '');
    setEditRepeatReason(experiment.repeatReason ?? '');
    setEditScaleUpDetail(experiment.scaleUpDetail ?? '');
    setEditParameterDetail(experiment.parameterDetail ?? '');
    setEditGeneralOverview(experiment.generalOverview ?? '');
    setEditReasonDiff(experiment.reasonDiff ?? '');
    setEditProcedureEquipment(experiment.procedureEquipment ?? '');
    setEditPlanResults(experiment.planResults ?? '');
    setJustSaved(false);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const saveEdit = async () => {
    setSaving(true);
    await updateExperiment(experiment.id, {
      title:           editTitle.trim() || experiment.title,
      batchNo:         editBatchNo.trim() || experiment.batchNo,
      authorLegacyId:  editAuthorId || null,
      experimentDate:  editDate,
      referenceUrl:    editRefUrl.trim() || null,
      yieldPct:        parseNum(editYieldPct),
      amount:          editAmount.trim() || null,
      ...(experiment.subType === 'repeat'    ? { repeatReason:    editRepeatReason.trim()    || null } : {}),
      ...(experiment.subType === 'scale_up'  ? { scaleUpDetail:   editScaleUpDetail.trim()   || null } : {}),
      ...(experiment.subType === 'parameter' ? { parameterDetail: editParameterDetail.trim() || null } : {}),
      generalOverview:    editGeneralOverview.trim()    || null,
      reasonDiff:         editReasonDiff.trim()         || null,
      procedureEquipment: editProcedureEquipment.trim() || null,
      planResults:        editPlanResults.trim()        || null,
    });
    setSaving(false);
    setIsEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  const handleDelete = async () => {
    const ok = await confirmAction({
      title: 'Deneyi sil?',
      message: `"${experiment.title}" ve tüm alt deneyleri, malzemeleri ve karakterizasyonları silinecek.`,
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (ok) {
      const parentId = experiment.parentId;
      await deleteExperiment(experiment.id);
      setMofTabSelectedExperimentId(parentId);
    }
  };

  const handlePdf = () => {
    exportExperimentPdf({
      experiment, parent, children,
      materials: materials.filter((m) => m.experimentId === experiment.id),
      characterizations: characterizations.filter((c) => c.experimentId === experiment.id),
      mofName: category?.name ?? '',
      users: portalUsers.map((u) => ({ id: u.id, name: u.name })),
    });
  };

  const breadcrumb = `${category?.name ?? ''}${experiment.subType ? ` · ${SUB_TYPE_LABEL[experiment.subType].toUpperCase()}` : ''}`;

  const inputCls = 'w-full px-2.5 py-1.5 text-[13px] bg-white border border-[#1F3D2E]/40 rounded-md outline-none focus:border-[#1F3D2E] focus:ring-2 focus:ring-[#1F3D2E]/15';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Üst bar ─────────────────────────────────────────────────────────── */}
      <div className={`px-7 pt-5 pb-4 border-b transition-colors ${isEditing ? 'border-[#1F3D2E] bg-[#f5efe0]/60' : 'border-[#cdc4ad]'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[10.5px] font-semibold tracking-[1.5px] uppercase text-[#6f6749]">
              <TypeIcon size={12} className="text-[#1F3D2E]" />
              {breadcrumb}
              {isEditing && <span className="ml-2 text-[#BA7517]">· DÜZENLEME MODU</span>}
            </div>
            {isEditing ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Deney başlığı..."
                className="helios-eln-title text-[32px] font-bold leading-tight mt-1 w-full bg-white border border-[#1F3D2E] rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-[#1F3D2E]/15"
              />
            ) : (
              <h1 className="helios-eln-title text-[32px] font-bold leading-tight mt-1 truncate">
                {experiment.title}
              </h1>
            )}
          </div>

          {/* Sağ üst aksiyon butonları */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isEditing ? (
              <>
                {justSaved && (
                  <span className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-teal-700">
                    <Check size={12} /> Kaydedildi
                  </span>
                )}
                <button
                  onClick={handlePdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-[#1F3D2E] border border-[#cdc4ad] rounded-lg hover:bg-[#ece4cf]"
                >
                  <FileText size={12} /> PDF
                </button>
                <button
                  onClick={() => onAddChild(experiment)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-[#1F3D2E] border border-[#cdc4ad] rounded-lg hover:bg-[#ece4cf]"
                >
                  <Plus size={12} /> Alt Deney
                </button>
                <button
                  onClick={enterEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-[#1F3D2E] border border-[#cdc4ad] rounded-lg hover:bg-[#ece4cf]"
                >
                  <Pencil size={12} /> Düzenle
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-[#791F1F] border border-[#cdc4ad] rounded-lg hover:bg-[#FCEBEB]"
                >
                  <Trash2 size={12} /> Sil
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-[#5a5240] bg-white border border-[#cdc4ad] rounded-lg hover:bg-[#ece4cf]"
                >
                  <X size={12} /> Vazgeç
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-white bg-[#1F3D2E] rounded-lg hover:bg-[#163022] disabled:opacity-60"
                >
                  <Check size={12} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-7 py-5 space-y-5">
        {/* ── KAYNAK kutusu (sadece sub-experiment) ──────────────────────────── */}
        {parent && (
          <div className="bg-[#f5efe0] border border-[#cdc4ad] rounded-lg px-4 py-2.5 flex items-center gap-3 text-[12px]">
            <span className="font-semibold tracking-[1px] uppercase text-[10px] text-[#6f6749]">Kaynak:</span>
            <button
              type="button"
              onClick={() => onSelectParent(parent.id)}
              className="inline-flex items-center gap-1 px-2 py-0.5 font-mono font-semibold text-[#1F3D2E] bg-white border border-[#cdc4ad] rounded hover:bg-[#ece4cf]"
            >
              {parent.title} <ArrowUpRight size={10} />
            </button>
            <span className="text-[#6f6749]">— {parent.batchNo}</span>
          </div>
        )}

        {/* ── Üst meta tablosu ───────────────────────────────────────────────── */}
        <div className={`border rounded-lg overflow-hidden bg-white/70 transition-colors ${isEditing ? 'border-[#1F3D2E]/40 ring-2 ring-[#1F3D2E]/10' : 'border-[#cdc4ad]'}`}>
          <MetaRow
            label="Deney Tarihi"
            value={isEditing ? (
              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className={`${inputCls} font-mono`} />
            ) : formatDateShort(experiment.experimentDate)}
            mono={!isEditing}
          />
          <MetaRow
            label="Deney sahibi"
            value={isEditing ? (
              <select value={editAuthorId} onChange={(e) => setEditAuthorId(e.target.value)} className={inputCls}>
                <option value="">—</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            ) : authorName}
          />
          <MetaRow
            label="Batch No"
            value={isEditing ? (
              <input value={editBatchNo} onChange={(e) => setEditBatchNo(e.target.value)} placeholder="HLS-2026-001" className={`${inputCls} font-mono`} />
            ) : experiment.batchNo}
            mono={!isEditing}
          />
          <MetaRow
            label="Referans makale (Drive)"
            value={isEditing ? (
              <input type="url" value={editRefUrl} onChange={(e) => setEditRefUrl(e.target.value)} placeholder="https://drive.google.com/..." className={inputCls} />
            ) : experiment.referenceUrl ? (
              <a
                href={experiment.referenceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#0C447C] hover:underline"
              >
                Makaleyi aç <ExternalLink size={11} />
              </a>
            ) : '—'}
          />
          <MetaRow
            label="Verim"
            value={isEditing ? (
              <input value={editYieldPct} onChange={(e) => setEditYieldPct(e.target.value)} placeholder="Örn. 75" className={`${inputCls} font-mono`} />
            ) : (experiment.yieldPct !== null ? `%${experiment.yieldPct}` : '—')}
            mono={!isEditing}
          />
          <MetaRow
            label="Elde Edilen Miktar"
            value={isEditing ? (
              <input value={editAmount} onChange={(e) => setEditAmount(e.target.value)} placeholder="Örn. 1.2 g" className={inputCls} />
            ) : (experiment.amount ?? '—')}
          />
          {experiment.subType === 'repeat' && (
            <MetaRow
              label={SUB_TYPE_DETAIL_LABEL.repeat}
              value={isEditing ? (
                <input value={editRepeatReason} onChange={(e) => setEditRepeatReason(e.target.value)} placeholder="Örn. Reproducibility kontrolü" className={inputCls} />
              ) : (experiment.repeatReason ?? '—')}
            />
          )}
          {experiment.subType === 'scale_up' && (
            <MetaRow
              label={SUB_TYPE_DETAIL_LABEL.scale_up}
              value={isEditing ? (
                <input value={editScaleUpDetail} onChange={(e) => setEditScaleUpDetail(e.target.value)} placeholder="Örn. 50g → 500g ölçek" className={inputCls} />
              ) : (experiment.scaleUpDetail ?? '—')}
            />
          )}
          {experiment.subType === 'parameter' && (
            <MetaRow
              label={SUB_TYPE_DETAIL_LABEL.parameter}
              value={isEditing ? (
                <input value={editParameterDetail} onChange={(e) => setEditParameterDetail(e.target.value)} placeholder="Örn. Sıcaklık 120°C → 110°C" className={inputCls} />
              ) : (experiment.parameterDetail ?? '—')}
            />
          )}
        </div>

        {/* ── Markdown bölümler — edit modunda hepsi textarea olur ─────────── */}
        <MarkdownSection
          label="Genel bakış"
          value={isEditing ? editGeneralOverview : experiment.generalOverview}
          onSave={(v) => updateExperiment(experiment.id, { generalOverview: v })}
          forceEdit={isEditing}
          onValueChange={setEditGeneralOverview}
        />
        <MarkdownSection
          label="Neden bu deney? / Önceki deneyden farkı"
          value={isEditing ? editReasonDiff : experiment.reasonDiff}
          onSave={(v) => updateExperiment(experiment.id, { reasonDiff: v })}
          forceEdit={isEditing}
          onValueChange={setEditReasonDiff}
        />
        <MarkdownSection
          label="Prosedür, Cihaz ve Teknik"
          value={isEditing ? editProcedureEquipment : experiment.procedureEquipment}
          onSave={(v) => updateExperiment(experiment.id, { procedureEquipment: v })}
          forceEdit={isEditing}
          onValueChange={setEditProcedureEquipment}
        />

        <MaterialsTable experimentId={experiment.id} editing={isEditing} />

        <MarkdownSection
          label="Deney Planı ve Sonuçları"
          value={isEditing ? editPlanResults : experiment.planResults}
          onSave={(v) => updateExperiment(experiment.id, { planResults: v })}
          forceEdit={isEditing}
          onValueChange={setEditPlanResults}
        />

        <CharacterizationList
          experimentId={experiment.id}
          experimentTitle={experiment.title}
          currentUserId={user.id}
          editing={isEditing}
        />
      </div>
    </div>
  );
};

const MetaRow: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="flex items-stretch border-b border-[#e6dfc8] last:border-0">
    <div className="w-52 shrink-0 px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[1px] text-[#6f6749] bg-[#f5efe0]/40 border-r border-[#e6dfc8] flex items-center">
      {label}
    </div>
    <div className={`flex-1 px-4 py-2 text-[13px] text-[#1F3D2E] flex items-center ${mono ? 'font-mono' : ''}`}>
      {value}
    </div>
  </div>
);
