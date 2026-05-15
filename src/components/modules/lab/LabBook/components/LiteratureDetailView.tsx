import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, ExternalLink, BookOpen, Check, X } from 'lucide-react';
import { confirmAction } from '../../../../../lib/confirm';
import { getCachedUsers } from '../../../../../lib/users';
import { useLabBook } from '../context';
import { formatDateShort } from '../types';
import type { LiteratureItem } from '../types';
import { MarkdownSection } from './MarkdownSection';

interface Props {
  item: LiteratureItem;
}

export const LiteratureDetailView: React.FC<Props> = ({ item }) => {
  const {
    literature: { updateLiterature, deleteLiterature },
    setLiteratureSelectedId,
  } = useLabBook();

  const portalUsers = getCachedUsers();
  const addedByName = item.addedBy
    ? portalUsers.find((u) => u.id === item.addedBy)?.name ?? item.addedBy
    : '—';

  // ── Inline edit state ───────────────────────────────────────────────────
  const [isEditing,   setIsEditing]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [justSaved,   setJustSaved]   = useState(false);
  const [editTitle,   setEditTitle]   = useState(item.title);
  const [editAuthors, setEditAuthors] = useState(item.authors ?? '');
  const [editJournal, setEditJournal] = useState(item.journal ?? '');
  const [editYear,    setEditYear]    = useState(item.year?.toString() ?? '');
  const [editSubject, setEditSubject] = useState(item.subject ?? '');
  const [editDoi,     setEditDoi]     = useState(item.doi ?? '');
  const [editUrl,     setEditUrl]     = useState(item.url ?? '');
  const [editSummary, setEditSummary] = useState(item.summary ?? '');
  const [editHelios,  setEditHelios]  = useState(item.heliosNotes ?? '');

  useEffect(() => {
    setIsEditing(false);
    setJustSaved(false);
    setEditTitle(item.title);
    setEditAuthors(item.authors ?? '');
    setEditJournal(item.journal ?? '');
    setEditYear(item.year?.toString() ?? '');
    setEditSubject(item.subject ?? '');
    setEditDoi(item.doi ?? '');
    setEditUrl(item.url ?? '');
    setEditSummary(item.summary ?? '');
    setEditHelios(item.heliosNotes ?? '');
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const enterEdit = () => {
    setEditTitle(item.title);
    setEditAuthors(item.authors ?? '');
    setEditJournal(item.journal ?? '');
    setEditYear(item.year?.toString() ?? '');
    setEditSubject(item.subject ?? '');
    setEditDoi(item.doi ?? '');
    setEditUrl(item.url ?? '');
    setEditSummary(item.summary ?? '');
    setEditHelios(item.heliosNotes ?? '');
    setJustSaved(false);
    setIsEditing(true);
  };
  const cancelEdit = () => setIsEditing(false);

  const saveEdit = async () => {
    setSaving(true);
    const yearNum = editYear ? parseInt(editYear, 10) : null;
    await updateLiterature(item.id, {
      title:       editTitle.trim() || item.title,
      authors:     editAuthors.trim() || null,
      journal:     editJournal.trim() || null,
      year:        Number.isFinite(yearNum as number) ? yearNum : null,
      subject:     editSubject.trim() || null,
      doi:         editDoi.trim() || null,
      url:         editUrl.trim() || null,
      summary:     editSummary.trim() || null,
      heliosNotes: editHelios.trim() || null,
    });
    setSaving(false);
    setIsEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  const handleDelete = async () => {
    const ok = await confirmAction({
      title: 'Literatür kaydını sil?',
      message: `"${item.title}" silinecek.`,
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (ok) {
      await deleteLiterature(item.id);
      setLiteratureSelectedId(null);
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
              <BookOpen size={12} className="text-[#1F3D2E]" />
              Literatür Kaydı
              {isEditing && <span className="ml-2 text-[#BA7517]">· DÜZENLEME MODU</span>}
            </div>
            {isEditing ? (
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Makale başlığı..."
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
        {/* ── Meta tablo ────────────────────────────────────────────────────── */}
        <div className={`border rounded-lg overflow-hidden bg-white/70 transition-colors ${isEditing ? 'border-[#1F3D2E]/40 ring-2 ring-[#1F3D2E]/10' : 'border-[#cdc4ad]'}`}>
          <MetaRow
            label="Yazarlar"
            value={isEditing
              ? <input value={editAuthors} onChange={(e) => setEditAuthors(e.target.value)} placeholder="Smith J., Jones K..." className={inputCls} />
              : (item.authors ?? '—')}
          />
          <MetaRow
            label="Dergi / Yıl"
            value={isEditing ? (
              <div className="flex gap-2">
                <input value={editJournal} onChange={(e) => setEditJournal(e.target.value)} placeholder="Dergi" className={`${inputCls} flex-1`} />
                <input type="number" value={editYear} onChange={(e) => setEditYear(e.target.value)} placeholder="2024" className={`${inputCls} w-24 font-mono`} />
              </div>
            ) : (
              [item.journal, item.year].filter(Boolean).join(' · ') || '—'
            )}
          />
          <MetaRow
            label="Konu / MOF"
            value={isEditing
              ? <input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} placeholder="örn: CALF-20" className={inputCls} />
              : (item.subject ?? '—')}
          />
          <MetaRow
            label="DOI / Link"
            value={isEditing ? (
              <div className="flex gap-2">
                <input value={editDoi} onChange={(e) => setEditDoi(e.target.value)} placeholder="10.1021/..." className={`${inputCls} flex-1 font-mono`} />
                <input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://..." className={`${inputCls} flex-1`} />
              </div>
            ) : (
              (item.doi || item.url) ? (
                <a
                  href={item.doi ? `https://doi.org/${item.doi}` : item.url!}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#0C447C] hover:underline"
                >
                  Makaleyi aç <ExternalLink size={11} />
                </a>
              ) : '—'
            )}
          />
          <MetaRow
            label="Eklendi"
            value={`${addedByName} · ${formatDateShort(item.createdAt)}`}
          />
        </div>

        {/* ── Markdown bölümler ─────────────────────────────────────────────── */}
        <MarkdownSection
          label="Özet"
          value={isEditing ? editSummary : item.summary}
          onSave={(v) => updateLiterature(item.id, { summary: v })}
          forceEdit={isEditing}
          onValueChange={setEditSummary}
        />
        <MarkdownSection
          label="Helios için Notlar"
          value={isEditing ? editHelios : item.heliosNotes}
          onSave={(v) => updateLiterature(item.id, { heliosNotes: v })}
          forceEdit={isEditing}
          onValueChange={setEditHelios}
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
