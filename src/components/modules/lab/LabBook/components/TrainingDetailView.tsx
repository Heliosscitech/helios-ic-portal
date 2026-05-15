import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, ExternalLink, GraduationCap, Check, X } from 'lucide-react';
import { confirmAction } from '../../../../../lib/confirm';
import { getCachedUsers, usePortalUsers } from '../../../../../lib/users';
import { useLabBook } from '../context';
import { TRAINING_CATEGORIES, TRAINING_LEVELS } from '../types';
import type { Training } from '../types';
import { MarkdownSection } from './MarkdownSection';

interface Props {
  item: Training;
}

export const TrainingDetailView: React.FC<Props> = ({ item }) => {
  const {
    training: { updateTraining, deleteTraining },
    setTrainingSelectedId,
  } = useLabBook();
  const { users } = usePortalUsers();

  const portalUsers = getCachedUsers();
  const preparedByName = item.addedBy
    ? portalUsers.find((u) => u.id === item.addedBy)?.name ?? item.addedBy
    : '—';

  // ── Inline edit state ───────────────────────────────────────────────────
  const [isEditing,    setIsEditing]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [justSaved,    setJustSaved]    = useState(false);
  const [editTitle,    setEditTitle]    = useState(item.title);
  const [editCategory, setEditCategory] = useState(item.category ?? TRAINING_CATEGORIES[0]);
  const [editLevel,    setEditLevel]    = useState(item.level ?? TRAINING_LEVELS[0]);
  const [editPreparedBy, setEditPreparedBy] = useState(item.addedBy ?? '');
  const [editUrl,      setEditUrl]      = useState(item.url ?? '');
  const [editPurpose,  setEditPurpose]  = useState(item.purpose ?? '');
  const [editSteps,    setEditSteps]    = useState(item.steps ?? '');
  const [editSafety,   setEditSafety]   = useState(item.safetyNotes ?? '');

  useEffect(() => {
    setIsEditing(false);
    setJustSaved(false);
    setEditTitle(item.title);
    setEditCategory(item.category ?? TRAINING_CATEGORIES[0]);
    setEditLevel(item.level ?? TRAINING_LEVELS[0]);
    setEditPreparedBy(item.addedBy ?? '');
    setEditUrl(item.url ?? '');
    setEditPurpose(item.purpose ?? '');
    setEditSteps(item.steps ?? '');
    setEditSafety(item.safetyNotes ?? '');
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const enterEdit = () => {
    setEditTitle(item.title);
    setEditCategory(item.category ?? TRAINING_CATEGORIES[0]);
    setEditLevel(item.level ?? TRAINING_LEVELS[0]);
    setEditPreparedBy(item.addedBy ?? '');
    setEditUrl(item.url ?? '');
    setEditPurpose(item.purpose ?? '');
    setEditSteps(item.steps ?? '');
    setEditSafety(item.safetyNotes ?? '');
    setJustSaved(false);
    setIsEditing(true);
  };
  const cancelEdit = () => setIsEditing(false);

  const saveEdit = async () => {
    setSaving(true);
    await updateTraining(item.id, {
      title:       editTitle.trim() || item.title,
      category:    editCategory || null,
      level:       editLevel || null,
      url:         editUrl.trim() || null,
      purpose:     editPurpose.trim() || null,
      steps:       editSteps.trim() || null,
      safetyNotes: editSafety.trim() || null,
    });
    setSaving(false);
    setIsEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  const handleDelete = async () => {
    const ok = await confirmAction({
      title: 'Eğitimi sil?',
      message: `"${item.title}" silinecek.`,
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (ok) {
      await deleteTraining(item.id);
      setTrainingSelectedId(null);
    }
  };

  const inputCls = 'w-full px-2.5 py-1.5 text-[13px] bg-white border border-[#1F3D2E]/40 rounded-md outline-none focus:border-[#1F3D2E] focus:ring-2 focus:ring-[#1F3D2E]/15';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Üst bar ────────────────────────────────────────────────────────── */}
      <div className={`px-7 pt-5 pb-4 border-b transition-colors ${isEditing ? 'border-[#1F3D2E] bg-[#f5efe0]/60' : 'border-[#cdc4ad]'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[10.5px] font-semibold tracking-[1.5px] uppercase text-[#6f6749]">
              <GraduationCap size={12} className="text-[#1F3D2E]" />
              Eğitim · Tutorial
              {isEditing && <span className="ml-2 text-[#BA7517]">· DÜZENLEME MODU</span>}
            </div>
            {isEditing ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Eğitim başlığı..."
                className="helios-eln-title text-[28px] font-bold leading-tight mt-1 w-full bg-white border border-[#1F3D2E] rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-[#1F3D2E]/15"
              />
            ) : (
              <h1 className="helios-eln-title text-[28px] font-bold leading-tight mt-1 break-words">
                {item.title}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isEditing ? (
              <>
                {justSaved && (
                  <span className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-teal-700">
                    <Check size={12} /> Kaydedildi
                  </span>
                )}
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
        {/* ── Meta tablo ───────────────────────────────────────────────────── */}
        <div className={`border rounded-lg overflow-hidden bg-white/70 transition-colors ${isEditing ? 'border-[#1F3D2E]/40 ring-2 ring-[#1F3D2E]/10' : 'border-[#cdc4ad]'}`}>
          <MetaRow
            label="Kategori"
            value={isEditing ? (
              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={inputCls}>
                {TRAINING_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (item.category ?? '—')}
          />
          <MetaRow
            label="Hazırlayan"
            value={isEditing ? (
              <select value={editPreparedBy} onChange={(e) => setEditPreparedBy(e.target.value)} className={inputCls}>
                <option value="">—</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            ) : preparedByName}
          />
          <MetaRow
            label="Seviye"
            value={isEditing ? (
              <select value={editLevel} onChange={(e) => setEditLevel(e.target.value)} className={inputCls}>
                {TRAINING_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            ) : (item.level ?? '—')}
          />
          <MetaRow
            label="Drive / Video"
            value={isEditing ? (
              <input
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://..."
                className={inputCls}
              />
            ) : item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#0C447C] hover:underline"
              >
                Kaynağı aç <ExternalLink size={11} />
              </a>
            ) : (
              <span className="text-[#6f6749]">Kaynağı aç: —</span>
            )}
          />
        </div>

        {/* ── Markdown bölümler ────────────────────────────────────────────── */}
        <MarkdownSection
          label="Amaç"
          value={isEditing ? editPurpose : item.purpose}
          onSave={(v) => updateTraining(item.id, { purpose: v })}
          forceEdit={isEditing}
          onValueChange={setEditPurpose}
        />
        <MarkdownSection
          label="Adımlar"
          value={isEditing ? editSteps : item.steps}
          onSave={(v) => updateTraining(item.id, { steps: v })}
          forceEdit={isEditing}
          onValueChange={setEditSteps}
        />
        <MarkdownSection
          label="Uyarılar / Güvenlik"
          value={isEditing ? editSafety : item.safetyNotes}
          onSave={(v) => updateTraining(item.id, { safetyNotes: v })}
          forceEdit={isEditing}
          onValueChange={setEditSafety}
        />
      </div>
    </div>
  );
};

const MetaRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-stretch border-b border-[#e6dfc8] last:border-0">
    <div className="w-44 shrink-0 px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[1px] text-[#6f6749] bg-[#f5efe0]/40 border-r border-[#e6dfc8] flex items-center">
      {label}
    </div>
    <div className="flex-1 px-4 py-2 text-[13px] text-[#1F3D2E] flex items-center">
      {value}
    </div>
  </div>
);
