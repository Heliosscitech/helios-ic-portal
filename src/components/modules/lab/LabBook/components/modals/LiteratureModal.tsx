import React, { useState } from 'react';
import { usePortalUsers } from '../../../../../../lib/users';
import { useLabBook } from '../../context';
import type { LiteratureItem } from '../../types';
import { ModalShell, FormField, inputClass } from './ModalShell';

interface Props {
  mode:          'add' | 'edit';
  item?:         LiteratureItem;
  currentUserId: string;
  onClose:       () => void;
}

export const LiteratureModal: React.FC<Props> = ({ mode, item, currentUserId, onClose }) => {
  const { literature: { addLiterature, updateLiterature } } = useLabBook();
  const { users } = usePortalUsers();

  const [title,   setTitle]   = useState(item?.title ?? '');
  const [authors, setAuthors] = useState(item?.authors ?? '');
  const [journal, setJournal] = useState(item?.journal ?? '');
  const [year,    setYear]    = useState(item?.year?.toString() ?? '');
  const [subject, setSubject] = useState(item?.subject ?? '');
  // Tek "DOI / Link" alanı: http/https ile başlıyorsa URL, değilse DOI
  const [reference, setReference] = useState(item?.url || item?.doi || '');
  const [addedById, setAddedById] = useState(item?.addedBy ?? currentUserId);
  const [summary, setSummary] = useState(item?.summary ?? '');
  const [submitting, setSubmitting] = useState(false);

  const splitReference = (ref: string): { doi: string | null; url: string | null } => {
    const trimmed = ref.trim();
    if (!trimmed) return { doi: null, url: null };
    if (/^https?:\/\//i.test(trimmed)) return { doi: null, url: trimmed };
    return { doi: trimmed, url: null };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    const yearNum = year ? parseInt(year, 10) : null;
    const finalYear = Number.isFinite(yearNum as number) ? yearNum : null;
    const { doi, url } = splitReference(reference);

    if (mode === 'add') {
      await addLiterature({
        title,
        authors: authors || null, journal: journal || null,
        year: finalYear,
        subject: subject || null,
        doi, url,
        summary: summary || null,
        addedByLegacyId: addedById || currentUserId,
      });
    } else if (item) {
      await updateLiterature(item.id, {
        title,
        authors: authors || null, journal: journal || null,
        year: finalYear,
        subject: subject || null,
        doi, url,
        summary: summary || null,
      });
    }
    setSubmitting(false);
    onClose();
  };

  return (
    <ModalShell
      title={mode === 'add' ? 'Yeni Literatür Kaydı' : 'Literatürü Düzenle'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel={mode === 'add' ? 'Ekle' : 'Kaydet'}
      maxWidth="max-w-xl"
    >
      <FormField label="Başlık" required>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Makale başlığı..."
          className={inputClass}
        />
      </FormField>

      <FormField label="Yazarlar">
        <input
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          placeholder="Smith J., Jones K., ..."
          className={inputClass}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Dergi">
          <input
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            placeholder="JACS, Nature Materials..."
            className={inputClass}
          />
        </FormField>
        <FormField label="Yıl">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2024"
            className={`${inputClass} font-mono`}
          />
        </FormField>
      </div>

      <FormField label="Konu / MOF">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="örn: CALF-20, MOF sentezi, BET..."
          className={inputClass}
        />
      </FormField>

      <FormField label="DOI / Link">
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="10.1021/... veya https://drive.google.com/..."
          className={`${inputClass} font-mono`}
        />
      </FormField>

      {mode === 'add' && (
        <FormField label="Ekleyen">
          <select value={addedById} onChange={(e) => setAddedById(e.target.value)} className={inputClass}>
            <option value="">—</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </FormField>
      )}

      <FormField label="Özet">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          placeholder="Önemli bulgular, alıntılar..."
          className={`${inputClass} resize-none`}
        />
      </FormField>
    </ModalShell>
  );
};
