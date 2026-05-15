import React, { useState } from 'react';
import { useLabBook } from '../../context';
import type { MofCategory } from '../../types';
import { ModalShell, FormField, inputClass } from './ModalShell';

interface Props {
  mode:      'add' | 'edit';
  category?: MofCategory;
  onClose:   () => void;
}

export const MofCategoryModal: React.FC<Props> = ({ mode, category, onClose }) => {
  const { mof: { addCategory, renameCategory } } = useLabBook();
  const [name, setName] = useState(category?.name ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    if (mode === 'add') {
      await addCategory(name.trim());
    } else if (category) {
      await renameCategory(category.id, name.trim());
    }
    setSubmitting(false);
    onClose();
  };

  return (
    <ModalShell
      title={mode === 'add' ? 'Yeni MOF Kategorisi' : 'MOF Kategorisini Düzenle'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel={mode === 'add' ? 'Ekle' : 'Kaydet'}
      maxWidth="max-w-md"
    >
      <FormField label="MOF Adı" required>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="örn: CALF-20, MIL-101..."
          className={inputClass}
        />
      </FormField>
    </ModalShell>
  );
};
