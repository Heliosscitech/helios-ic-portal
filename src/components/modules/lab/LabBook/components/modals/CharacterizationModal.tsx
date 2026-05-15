import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../../../../../../lib/supabase';
import { usePortalUsers } from '../../../../../../lib/users';
import { toast } from '../../../../../../lib/toast';
import { useLabBook } from '../../context';
import { CHARACTERIZATION_TYPES } from '../../types';
import type { ExperimentCharacterization } from '../../types';
import { ModalShell, FormField, inputClass } from './ModalShell';

interface Props {
  mode:              'add' | 'edit';
  experimentId:      string;
  experimentTitle:   string;
  characterization?: ExperimentCharacterization;
  currentUserId:     string;
  onClose:           () => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const MAX_BYTES = 3 * 1024 * 1024;
const STORAGE_BUCKET = 'lab-book-images';

export const CharacterizationModal: React.FC<Props> = ({
  mode, experimentId, experimentTitle, characterization, currentUserId, onClose,
}) => {
  const { mof: { addCharacterization, updateCharacterization } } = useLabBook();
  const { users } = usePortalUsers();

  const [type,         setType]         = useState(characterization?.type ?? CHARACTERIZATION_TYPES[0]);
  const [performedAt,  setPerformedAt]  = useState(characterization?.performedAt ?? todayISO());
  const [performedBy,  setPerformedBy]  = useState(characterization?.performedById ?? currentUserId);
  const [attachmentUrl,setAttachmentUrl]= useState(characterization?.attachmentUrl ?? '');
  const [imageUrl,     setImageUrl]     = useState(characterization?.imageUrl ?? '');
  const [notes,        setNotes]        = useState(characterization?.notes ?? '');
  const [submitting,   setSubmitting]   = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error('Dosya 3MB\'den büyük olamaz');
      return;
    }
    if (!/^image\//.test(file.type)) {
      toast.error('Sadece görsel dosyası yükleyebilirsiniz');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop() || 'png';
    const path = `${experimentId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) {
      toast.error('Yüklenemedi: ' + error.message);
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    setImageUrl(publicUrl);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type.trim()) return;
    setSubmitting(true);
    if (mode === 'add') {
      await addCharacterization({
        experimentId, type,
        notes: notes || null,
        attachmentUrl: attachmentUrl || null,
        imageUrl: imageUrl || null,
        performedAt: performedAt || null,
        performedByLegacyId: performedBy || null,
      });
    } else if (characterization) {
      await updateCharacterization(characterization.id, {
        type,
        notes: notes || null,
        attachmentUrl: attachmentUrl || null,
        imageUrl: imageUrl || null,
        performedAt: performedAt || null,
        performedByLegacyId: performedBy || null,
      });
    }
    setSubmitting(false);
    onClose();
  };

  return (
    <ModalShell
      breadcrumb={experimentTitle.toUpperCase()}
      title="Karakterizasyonlar"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitLabel={mode === 'add' ? 'Kaydet' : 'Kaydet'}
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Tür" required>
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            {CHARACTERIZATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </FormField>
        <FormField label="Tarih">
          <input
            type="date"
            value={performedAt}
            onChange={(e) => setPerformedAt(e.target.value)}
            className={`${inputClass} font-mono`}
          />
        </FormField>
        <FormField label="Yapan">
          <select value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} className={inputClass}>
            <option value="">—</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </FormField>
      </div>

      <FormField label="Drive Linki">
        <input
          type="url"
          value={attachmentUrl}
          onChange={(e) => setAttachmentUrl(e.target.value)}
          placeholder="https://drive.google.com/..."
          className={inputClass}
        />
      </FormField>

      <FormField label="Görsel">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
        {imageUrl ? (
          <div className="border border-[#cdc4ad] rounded-lg p-2 bg-white flex items-center gap-3">
            <img src={imageUrl} alt="Önizleme" className="w-16 h-16 object-cover rounded" />
            <div className="flex-1 min-w-0">
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11.5px] text-[#0C447C] hover:underline truncate block"
              >
                {imageUrl.split('/').pop()}
              </a>
            </div>
            <button
              type="button"
              onClick={() => setImageUrl('')}
              className="p-1.5 text-[#791F1F] hover:bg-[#FCEBEB] rounded"
              title="Görseli kaldır"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[1px] text-[#1F3D2E] bg-white border border-[#cdc4ad] rounded-lg hover:bg-[#ece4cf] disabled:opacity-60"
          >
            {uploading ? (
              <><Loader2 size={13} className="animate-spin" /> Yükleniyor...</>
            ) : (
              <><Upload size={13} /> Görsel Yükle</>
            )}
          </button>
        )}
        <p className="mt-1 text-[10.5px] text-[#6f6749] flex items-center gap-1.5">
          <ImageIcon size={10} /> Max 3MB · PNG, JPG vb.
        </p>
      </FormField>

      <FormField label="Sonuç / Yorum">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="BET yüzey alanı, pikler, gözlemler..."
          className={`${inputClass} resize-none`}
        />
      </FormField>
    </ModalShell>
  );
};
