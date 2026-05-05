import React, { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../../lib/toast';
import { useConfirm } from '../../lib/confirm';
import { useIdentity } from './hooks';
import { IDENTITY_CATEGORIES } from './types';
import type { IdentityCategory } from './types';

export const KunyePanel: React.FC = () => {
  const { items, loading, add, update, remove } = useIdentity();
  const toast = useToast();
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<IdentityCategory>('adresler');
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftValue, setDraftValue] = useState('');

  const filtered = items.filter((e) => e.category === activeTab);

  const startNew = () => { setDraftLabel(''); setDraftValue(''); setEditingId('new'); };
  const startEdit = (id: string, label: string, value: string) => {
    setDraftLabel(label); setDraftValue(value); setEditingId(id);
  };
  const cancel = () => { setEditingId(null); setDraftLabel(''); setDraftValue(''); };
  const save = async () => {
    if (!draftLabel.trim() || !draftValue.trim()) return;
    const isNew = editingId === 'new';
    const ok = isNew
      ? await add(activeTab, draftLabel.trim(), draftValue.trim())
      : editingId
        ? await update(editingId, { label: draftLabel.trim(), value: draftValue.trim() })
        : false;
    if (ok) {
      toast.success(isNew ? 'Satır eklendi' : 'Satır güncellendi');
      cancel();
    } else {
      toast.error('Kaydedilemedi');
    }
  };

  const handleDelete = async (id: string, label: string) => {
    const ok = await confirm({
      title: 'Satırı sil?',
      message: `"${label}" satırı kalıcı olarak silinecek.`,
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (!ok) return;
    const success = await remove(id);
    if (success) toast.success('Satır silindi');
    else toast.error('Silinemedi');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-[13px] text-text-3 font-medium">Sabit bilgiler: adresler, sabit hatlar, şirket bilgileri</p>
      </div>

      <div className="flex items-center gap-2">
        {IDENTITY_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setActiveTab(cat.id); cancel(); }}
            className={cn(
              'px-4 py-1.5 text-[12px] font-bold rounded-lg transition-all',
              activeTab === cat.id
                ? 'bg-[#1a1a19] text-white'
                : 'bg-surface-2 text-text-3 hover:text-text'
            )}
          >
            {cat.label}
          </button>
        ))}
        <button
          onClick={startNew}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold border border-border/40 rounded-lg bg-white hover:bg-surface-2 transition-colors"
        >
          <Plus size={12} /> Satır ekle
        </button>
      </div>

      {loading ? (
        <p className="text-[12px] text-text-3 italic py-6 text-center">Yükleniyor…</p>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 && editingId !== 'new' && (
            <p className="text-[12px] text-text-3 italic py-6 text-center">Bu kategoride satır yok.</p>
          )}
          {filtered.map((e) => (
            editingId === e.id ? (
              <RowForm
                key={e.id}
                label={draftLabel}
                value={draftValue}
                onLabel={setDraftLabel}
                onValue={setDraftValue}
                onCancel={cancel}
                onSave={save}
              />
            ) : (
              <div key={e.id} className="bg-white border border-border/40 rounded-xl px-5 py-3 flex items-center gap-4 group hover:bg-surface-2/40 transition-colors">
                <span className="text-[13px] font-semibold text-text-2 w-48 shrink-0">{e.label}</span>
                <span className="text-[13px] text-text flex-1 min-w-0">{e.value}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => startEdit(e.id, e.label, e.value)} className="p-1.5 rounded hover:bg-surface-2 text-text-3 hover:text-text"><Pencil size={12} /></button>
                  <button onClick={() => handleDelete(e.id, e.label)} className="p-1.5 rounded hover:bg-red-50 text-text-3 hover:text-red-500"><Trash2 size={12} /></button>
                </div>
              </div>
            )
          ))}
          {editingId === 'new' && (
            <RowForm
              label={draftLabel}
              value={draftValue}
              onLabel={setDraftLabel}
              onValue={setDraftValue}
              onCancel={cancel}
              onSave={save}
            />
          )}
        </div>
      )}
    </div>
  );
};

const RowForm: React.FC<{
  label: string;
  value: string;
  onLabel: (s: string) => void;
  onValue: (s: string) => void;
  onCancel: () => void;
  onSave: () => void;
}> = ({ label, value, onLabel, onValue, onCancel, onSave }) => (
  <div className="bg-surface-2/50 border border-border/40 rounded-xl px-5 py-3 flex items-center gap-3">
    <input
      type="text" value={label} onChange={(e) => onLabel(e.target.value)}
      placeholder="Etiket (örn. Teknopark İstanbul)" autoFocus
      className="w-48 shrink-0 px-3 py-2 text-[13px] rounded-lg bg-white border border-border/40 focus:outline-none focus:border-info-border"
    />
    <input
      type="text" value={value} onChange={(e) => onValue(e.target.value)}
      placeholder="Değer (örn. tam adres)"
      className="flex-1 px-3 py-2 text-[13px] rounded-lg bg-white border border-border/40 focus:outline-none focus:border-info-border"
    />
    <button onClick={onCancel} className="p-2 rounded-lg hover:bg-surface-2 text-text-3" title="Vazgeç"><X size={14} /></button>
    <button
      onClick={onSave}
      disabled={!label.trim() || !value.trim()}
      className="px-3 py-2 text-[12px] font-bold bg-[#1a1a19] text-white rounded-lg hover:bg-black disabled:opacity-50"
    >
      Kaydet
    </button>
  </div>
);
