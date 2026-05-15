import React, { useEffect, useRef, useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface MarkdownSectionProps {
  label:          string;
  value:          string | null;
  placeholder?:   string;
  onSave:         (value: string | null) => void | Promise<void>;
  /** Parent edit moduna girdiğinde force-edit: kendi butonu yerine parent yönetir */
  forceEdit?:     boolean;
  /** Force-edit aktifken parent'a değer iletilir */
  onValueChange?: (value: string) => void;
}

export const MarkdownSection: React.FC<MarkdownSectionProps> = ({
  label, value, placeholder = '— (boş)', onSave, forceEdit, onValueChange,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value ?? '');
  const [saving,  setSaving]  = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (!editing) setDraft(value ?? ''); }, [value, editing]);

  // ── Parent-controlled edit modu ────────────────────────────────────────
  if (forceEdit) {
    return (
      <section className="border-b border-[#cdc4ad]/60 pb-4">
        <h3 className="helios-eln-title text-[15px] font-bold flex items-center gap-2 mb-2">
          <span className="text-[#BA7517]">✱</span>
          {label}
        </h3>
        <textarea
          value={value ?? ''}
          onChange={(e) => onValueChange?.(e.target.value)}
          rows={4}
          placeholder="Buraya yazın..."
          className="w-full px-3 py-2 text-[13px] bg-white border border-[#1F3D2E]/40 rounded-lg outline-none focus:border-[#1F3D2E] focus:ring-2 focus:ring-[#1F3D2E]/15 resize-y leading-relaxed"
        />
      </section>
    );
  }

  const start = () => {
    setDraft(value ?? '');
    setEditing(true);
    setTimeout(() => ref.current?.focus(), 0);
  };

  const cancel = () => {
    setDraft(value ?? '');
    setEditing(false);
  };

  const commit = async () => {
    const trimmed = draft.trim();
    if ((trimmed || null) === (value || null)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onSave(trimmed || null);
    setSaving(false);
    setEditing(false);
  };

  return (
    <section className="border-b border-[#cdc4ad]/60 pb-4">
      <div className="flex items-center justify-between mb-2 group/sec">
        <h3 className="helios-eln-title text-[15px] font-bold flex items-center gap-2">
          <span className="text-[#BA7517]">✱</span>
          {label}
        </h3>
        {!editing && (
          <button
            type="button"
            onClick={start}
            className="opacity-0 group-hover/sec:opacity-100 flex items-center gap-1 px-2 py-1 text-[10.5px] font-semibold text-[#1F3D2E] border border-[#cdc4ad] rounded-md hover:bg-[#ece4cf] transition-all"
          >
            <Pencil size={11} /> Düzenle
          </button>
        )}
      </div>

      {!editing ? (
        <div
          onClick={start}
          className="cursor-text rounded-lg hover:bg-[#f5efe0]/50 transition-colors px-3 py-2"
        >
          {value ? (
            <p className="text-[13px] text-[#1F3D2E] whitespace-pre-wrap leading-relaxed">{value}</p>
          ) : (
            <p className="text-[12.5px] italic text-[#9b9275]">{placeholder}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            ref={ref}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') cancel();
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
            }}
            rows={5}
            placeholder="Buraya yazın... (Cmd/Ctrl+Enter ile kaydet, Esc ile vazgeç)"
            className="w-full px-3 py-2 text-[13px] bg-white border border-[#1F3D2E] rounded-lg outline-none focus:ring-2 focus:ring-[#1F3D2E]/15 resize-y leading-relaxed"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 text-[11.5px] font-semibold text-[#5a5240] bg-white border border-[#cdc4ad] rounded-lg hover:bg-[#ece4cf]"
            >
              <X size={12} /> Vazgeç
            </button>
            <button
              type="button"
              onClick={commit}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-[1px] text-white bg-[#1F3D2E] rounded-lg hover:bg-[#163022] disabled:opacity-60"
            >
              <Check size={12} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
