import React, { useState } from 'react';
import { useLabBook } from '../../context';
import type { ShapingVariant } from '../../types';
import { ModalShell, FormField, inputClass } from './ModalShell';

interface Props {
  mode:          'add' | 'edit';
  mofCategoryId: string;
  variant?:      ShapingVariant;
  onClose:       () => void;
}

const PRESETS = ['Pellet', 'Granül', 'Film', 'Monolit'];

export const ShapingVariantModal: React.FC<Props> = ({ mode, mofCategoryId, variant, onClose }) => {
  const { mof: { addShapingVariant, renameShapingVariant } } = useLabBook();
  const [name, setName] = useState(variant?.name ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    if (mode === 'add') {
      await addShapingVariant(mofCategoryId, name.trim());
    } else if (variant) {
      await renameShapingVariant(variant.id, name.trim());
    }
    setSubmitting(false);
    onClose();
  };

  return (
    <ModalShell
      title={mode === 'add' ? 'Yeni Şekillendirme Varyantı' : 'Varyantı Düzenle'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel={mode === 'add' ? 'Ekle' : 'Kaydet'}
      maxWidth="max-w-md"
    >
      <FormField label="Varyant Adı" required>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="örn: Pellet, Granül, Film..."
          className={inputClass}
        />
      </FormField>
      {mode === 'add' && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[1px] text-[#6f6749] mb-1.5">Hazır</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setName(p)}
                className="px-2.5 py-1 text-[11.5px] font-semibold text-[#1F3D2E] bg-white border border-[#cdc4ad] rounded-md hover:bg-[#ece4cf]"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </ModalShell>
  );
};
