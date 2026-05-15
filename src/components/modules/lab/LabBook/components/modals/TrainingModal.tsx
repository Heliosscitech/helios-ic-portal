import React, { useState } from 'react';
import { usePortalUsers } from '../../../../../../lib/users';
import { useLabBook } from '../../context';
import { TRAINING_CATEGORIES, TRAINING_LEVELS } from '../../types';
import type { Training } from '../../types';
import { ModalShell, FormField, inputClass } from './ModalShell';

interface Props {
  mode:          'add' | 'edit';
  item?:         Training;
  currentUserId: string;
  onClose:       () => void;
}

export const TrainingModal: React.FC<Props> = ({ mode, item, currentUserId, onClose }) => {
  const { training: { addTraining, updateTraining } } = useLabBook();
  const { users } = usePortalUsers();

  const [title,    setTitle]    = useState(item?.title ?? '');
  const [category, setCategory] = useState(item?.category ?? TRAINING_CATEGORIES[0]);
  const [level,    setLevel]    = useState(item?.level ?? TRAINING_LEVELS[0]);
  const [preparedById, setPreparedById] = useState(item?.addedBy ?? currentUserId);
  const [url,      setUrl]      = useState(item?.url ?? '');
  const [purpose,  setPurpose]  = useState(item?.purpose ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    if (mode === 'add') {
      await addTraining({
        title,
        category: category || null,
        level: level || null,
        url: url || null,
        purpose: purpose || null,
        addedByLegacyId: preparedById || currentUserId,
      });
    } else if (item) {
      await updateTraining(item.id, {
        title,
        category: category || null,
        level: level || null,
        url: url || null,
        purpose: purpose || null,
      });
    }
    setSubmitting(false);
    onClose();
  };

  return (
    <ModalShell
      title={mode === 'add' ? 'Yeni Eğitim / Tutorial' : 'Eğitimi Düzenle'}
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
          placeholder="Eğitim başlığı..."
          className={inputClass}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Kategori">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {TRAINING_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormField>
        <FormField label="Seviye">
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass}>
            {TRAINING_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Hazırlayan">
          <select value={preparedById} onChange={(e) => setPreparedById(e.target.value)} className={inputClass}>
            <option value="">—</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </FormField>
        <FormField label="Drive / Video Linki">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </FormField>
      </div>

      <FormField label="Amaç">
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          rows={4}
          placeholder="Bu eğitim ne sağlar, ne öğretir?"
          className={`${inputClass} resize-none`}
        />
      </FormField>
    </ModalShell>
  );
};
