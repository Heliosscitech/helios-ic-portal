import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronRight, Plus, Trash2, X, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../../lib/toast';
import { useConfirm } from '../../lib/confirm';
import { useQuickLinks } from './hooks';
import { LINK_COLOR_PALETTE } from './types';
import type { QuickLink } from './types';

const ensureProtocol = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) return trimmed;
  return `https://${trimmed}`;
};

export const QuickLinksPanel: React.FC = () => {
  const { items, loading } = useQuickLinks();
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-white border border-border/40 rounded-2xl shadow-sm p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-[15px] font-bold flex items-center gap-2">
          <Zap size={18} className="text-[#010D52]" /> Hızlı linkler
        </h4>
        <button
          onClick={() => setEditing(true)}
          className="text-[11px] font-bold text-text-3 hover:text-text border border-border/40 px-2 py-0.5 rounded transition-all"
        >
          Düzenle
        </button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-[12px] text-text-3 italic py-6 text-center">Yükleniyor…</p>
        ) : items.length === 0 ? (
          <p className="text-[12px] text-text-3 italic py-6 text-center">Henüz link yok. "Düzenle" ile ekleyebilirsin.</p>
        ) : (
          items.map((link) => (
            <a
              key={link.id}
              href={ensureProtocol(link.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-3 border border-transparent hover:border-border/40 hover:bg-surface rounded-xl transition-all group"
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[14px] shrink-0', link.color)}>
                {link.initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-text-2 truncate">{link.name}</p>
                {link.description && <p className="text-[11px] text-text-3 truncate">{link.description}</p>}
              </div>
              <ChevronRight size={14} className="text-text-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
            </a>
          ))
        )}
      </div>

      {editing && <EditModal onClose={() => setEditing(false)} />}
    </div>
  );
};

const EditModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { items, add, update, remove, reorder } = useQuickLinks();
  const toast = useToast();
  const confirm = useConfirm();
  const [creating, setCreating] = useState(false);

  const handleDelete = async (link: QuickLink) => {
    const ok = await confirm({
      title: 'Linki sil?',
      message: `"${link.name}" linki kalıcı olarak silinecek.`,
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (!ok) return;
    const success = await remove(link.id);
    if (success) toast.success('Link silindi');
    else toast.error('Silinemedi');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="text-[16px] font-black text-text">Hızlı Linkleri Düzenle</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-3"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {items.length === 0 && !creating && (
            <p className="text-[12px] text-text-3 italic py-6 text-center">Henüz link yok. Aşağıdan ilk linki ekle.</p>
          )}
          {items.map((link, idx) => (
            <LinkRow
              key={link.id}
              link={link}
              isFirst={idx === 0}
              isLast={idx === items.length - 1}
              onUpdate={async (patch) => {
                const ok = await update(link.id, patch);
                if (ok) toast.success('Güncellendi');
                else toast.error('Güncellenemedi');
              }}
              onDelete={() => handleDelete(link)}
              onMoveUp={async () => {
                const ok = await reorder(link.id, 'up');
                if (!ok) toast.error('Sıra değiştirilemedi');
              }}
              onMoveDown={async () => {
                const ok = await reorder(link.id, 'down');
                if (!ok) toast.error('Sıra değiştirilemedi');
              }}
            />
          ))}
          {creating && (
            <NewLinkForm
              defaultColor={LINK_COLOR_PALETTE[items.length % LINK_COLOR_PALETTE.length]}
              onCancel={() => setCreating(false)}
              onSave={async (input) => {
                const ok = await add(input);
                if (ok) {
                  toast.success('Link eklendi');
                  setCreating(false);
                } else {
                  toast.error('Link eklenemedi');
                }
              }}
            />
          )}
        </div>

        <div className="px-6 py-4 border-t border-border/40 flex justify-between items-center">
          {!creating ? (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold border border-border/40 rounded-lg bg-white hover:bg-surface-2"
            >
              <Plus size={14} /> Yeni link
            </button>
          ) : <div />}
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-bold bg-[#1a1a19] text-white rounded-lg hover:bg-black"
          >
            Bitti
          </button>
        </div>
      </div>
    </div>
  );
};

interface LinkRowProps {
  link: QuickLink;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (patch: Partial<{ name: string; description: string; url: string; color: string; initial: string }>) => Promise<void>;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const LinkRow: React.FC<LinkRowProps> = ({ link, isFirst, isLast, onUpdate, onDelete, onMoveUp, onMoveDown }) => {
  const [name, setName] = useState(link.name);
  const [url, setUrl] = useState(link.url);
  const [description, setDescription] = useState(link.description);

  // Blur'da kaydet — kullanıcı alan dışına çıktığında DB'ye yaz.
  const flushIfChanged = (field: 'name' | 'description' | 'url', value: string) => {
    if (value === link[field]) return;
    void onUpdate({ [field]: value });
  };

  return (
    <div className="bg-surface-2/40 border border-border/40 rounded-xl p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[13px] shrink-0 mt-1', link.color)}>
          {link.initial}
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <input
            type="text" value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => flushIfChanged('name', name)}
            placeholder="Ad"
            className="w-full px-2.5 py-1.5 text-[13px] font-bold rounded bg-white border border-border/40 focus:outline-none focus:border-info-border"
          />
          <input
            type="url" value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => flushIfChanged('url', url)}
            placeholder="URL (https://...)"
            className="w-full px-2.5 py-1.5 text-[12px] rounded bg-white border border-border/40 focus:outline-none focus:border-info-border"
          />
          <input
            type="text" value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => flushIfChanged('description', description)}
            placeholder="Açıklama (opsiyonel)"
            className="w-full px-2.5 py-1.5 text-[12px] rounded bg-white border border-border/40 focus:outline-none focus:border-info-border"
          />
          <ColorPicker value={link.color} onChange={(c) => onUpdate({ color: c })} />
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1.5 rounded hover:bg-surface-2 text-text-3 hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
            title="Yukarı"
          >
            <ArrowUp size={12} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1.5 rounded hover:bg-surface-2 text-text-3 hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
            title="Aşağı"
          >
            <ArrowDown size={12} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-red-50 text-text-3 hover:text-red-500"
            title="Sil"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface NewLinkFormProps {
  defaultColor: string;
  onCancel: () => void;
  onSave: (input: { name: string; description: string; url: string; color: string }) => Promise<void> | void;
}

const NewLinkForm: React.FC<NewLinkFormProps> = ({ defaultColor, onCancel, onSave }) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(defaultColor);

  const canSave = name.trim().length > 0 && url.trim().length > 0;

  return (
    <div className="bg-info-bg/40 border border-info-border/30 rounded-xl p-3 space-y-2">
      <input
        type="text" value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Ad" autoFocus
        className="w-full px-2.5 py-1.5 text-[13px] font-bold rounded bg-white border border-border/40 focus:outline-none focus:border-info-border"
      />
      <input
        type="url" value={url} onChange={(e) => setUrl(e.target.value)}
        placeholder="URL (https://...)"
        className="w-full px-2.5 py-1.5 text-[12px] rounded bg-white border border-border/40 focus:outline-none focus:border-info-border"
      />
      <input
        type="text" value={description} onChange={(e) => setDescription(e.target.value)}
        placeholder="Açıklama (opsiyonel)"
        className="w-full px-2.5 py-1.5 text-[12px] rounded bg-white border border-border/40 focus:outline-none focus:border-info-border"
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-1.5 text-[12px] font-bold border border-border/40 rounded-lg bg-white hover:bg-surface-2">Vazgeç</button>
        <button
          onClick={() => canSave && onSave({ name: name.trim(), url: url.trim(), description: description.trim(), color })}
          disabled={!canSave}
          className="px-3 py-1.5 text-[12px] font-bold bg-[#1a1a19] text-white rounded-lg hover:bg-black disabled:opacity-50"
        >
          Kaydet
        </button>
      </div>
    </div>
  );
};

const ColorPicker: React.FC<{ value: string; onChange: (c: string) => void }> = ({ value, onChange }) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    {LINK_COLOR_PALETTE.map((c) => {
      const selected = c === value;
      return (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cn(
            'w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold transition-all',
            c,
            selected ? 'ring-2 ring-text scale-110' : 'opacity-70 hover:opacity-100'
          )}
          title={c}
        >
          {selected && <Check size={10} />}
        </button>
      );
    })}
  </div>
);
