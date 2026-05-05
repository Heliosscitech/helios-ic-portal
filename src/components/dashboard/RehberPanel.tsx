import React, { useMemo, useState } from 'react';
import { Mail, Pencil, Phone, Plus, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../../lib/toast';
import { useConfirm } from '../../lib/confirm';
import { useDirectory } from './hooks';
import type { DirectoryContact, DirectoryGroup } from './types';

const initial = (s: string) => (s.trim()[0] ?? '?').toUpperCase();

export const RehberPanel: React.FC = () => {
  const dir = useDirectory();
  const toast = useToast();
  const confirm = useConfirm();
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of dir.contacts) map.set(c.groupId, (map.get(c.groupId) ?? 0) + 1);
    return map;
  }, [dir.contacts]);

  const openGroup = openGroupId ? dir.groups.find((g) => g.id === openGroupId) : null;
  const openGroupContacts = openGroup ? dir.contacts.filter((c) => c.groupId === openGroup.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-3 font-medium">Grup seç veya yeni grup aç</p>
        <button
          onClick={() => setShowAddGroup(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold border border-border/40 rounded-lg bg-white hover:bg-surface-2 transition-colors"
        >
          <Plus size={12} /> Grup ekle
        </button>
      </div>

      {dir.loading ? (
        <p className="text-[12px] text-text-3 italic py-6 text-center">Yükleniyor…</p>
      ) : dir.groups.length === 0 ? (
        <p className="text-[12px] text-text-3 italic py-6 text-center">Henüz grup yok. "+ Grup ekle" ile başla.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {dir.groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setOpenGroupId(g.id)}
              className="bg-white border border-border/40 rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-sm transition-all"
            >
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold', g.color)}>
                {initial(g.name)}
              </div>
              <span className="text-[13px] font-bold text-text text-center">{g.name}</span>
              <span className="text-[11px] text-text-3">{counts.get(g.id) ?? 0} kişi</span>
            </button>
          ))}
        </div>
      )}

      {showAddGroup && (
        <AddGroupModal
          onClose={() => setShowAddGroup(false)}
          onSave={async (name) => {
            const ok = await dir.addGroup(name);
            if (ok) { toast.success('Grup eklendi'); setShowAddGroup(false); }
            else toast.error('Grup eklenemedi');
          }}
        />
      )}

      {openGroup && (
        <GroupDetailModal
          group={openGroup}
          contacts={openGroupContacts}
          onClose={() => setOpenGroupId(null)}
          onAddContact={async (input) => {
            const ok = await dir.addContact(openGroup.id, input);
            if (ok) toast.success('Kişi eklendi');
            else toast.error('Kişi eklenemedi');
          }}
          onUpdateContact={async (id, patch) => {
            const ok = await dir.updateContact(id, patch);
            if (ok) toast.success('Kişi güncellendi');
            else toast.error('Güncellenemedi');
          }}
          onRemoveContact={async (id, name) => {
            const yes = await confirm({
              title: 'Kişiyi sil?',
              message: `"${name}" kalıcı olarak silinecek.`,
              confirmText: 'Sil',
              variant: 'danger',
            });
            if (!yes) return;
            const ok = await dir.removeContact(id);
            if (ok) toast.success('Kişi silindi');
            else toast.error('Silinemedi');
          }}
          onRemoveGroup={async () => {
            const yes = await confirm({
              title: 'Grubu sil?',
              message: `"${openGroup.name}" grubu ve içindeki tüm kişiler kalıcı olarak silinecek.`,
              confirmText: 'Sil',
              variant: 'danger',
            });
            if (!yes) return;
            const ok = await dir.removeGroup(openGroup.id);
            if (ok) {
              toast.success('Grup silindi');
              setOpenGroupId(null);
            } else {
              toast.error('Silinemedi');
            }
          }}
        />
      )}
    </div>
  );
};

const AddGroupModal: React.FC<{
  onClose: () => void;
  onSave: (name: string) => void | Promise<void>;
}> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="text-[16px] font-black text-text">Yeni grup</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-2 text-text-3"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-3">
          <label className="block text-[10px] uppercase tracking-widest text-text-3 font-semibold">Grup adı</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Ekip, Tedarikçi, BOUN..."
            autoFocus
            className="w-full px-3 py-2 text-[13px] rounded-lg bg-surface-2 border border-border/40 focus:outline-none focus:border-info-border"
          />
        </div>
        <div className="px-6 py-4 border-t border-border/40 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-bold border border-border/40 rounded-lg bg-white hover:bg-surface-2">Vazgeç</button>
          <button
            onClick={() => name.trim() && onSave(name.trim())}
            disabled={!name.trim()}
            className="px-4 py-2 text-[13px] font-bold bg-[#1a1a19] text-white rounded-lg hover:bg-black disabled:opacity-50"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

type ContactInput = { name: string; role: string; phone: string; email: string; notes: string };
const EMPTY_CONTACT: ContactInput = { name: '', role: '', phone: '', email: '', notes: '' };

const GroupDetailModal: React.FC<{
  group: DirectoryGroup;
  contacts: DirectoryContact[];
  onClose: () => void;
  onAddContact: (input: ContactInput) => Promise<void> | void;
  onUpdateContact: (id: string, patch: Partial<ContactInput>) => Promise<void> | void;
  onRemoveContact: (id: string, name: string) => Promise<void> | void;
  onRemoveGroup: () => Promise<void> | void;
}> = ({ group, contacts, onClose, onAddContact, onUpdateContact, onRemoveContact, onRemoveGroup }) => {
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<ContactInput>(EMPTY_CONTACT);

  const startNew = () => { setDraft(EMPTY_CONTACT); setEditingId('new'); };
  const startEdit = (c: DirectoryContact) => {
    setDraft({ name: c.name, role: c.role, phone: c.phone, email: c.email, notes: c.notes });
    setEditingId(c.id);
  };
  const cancel = () => { setEditingId(null); setDraft(EMPTY_CONTACT); };
  const save = async () => {
    if (!draft.name.trim()) return;
    if (editingId === 'new') await onAddContact(draft);
    else if (editingId) await onUpdateContact(editingId, draft);
    cancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold', group.color)}>
              {initial(group.name)}
            </div>
            <div>
              <h2 className="text-[16px] font-black text-text">{group.name}</h2>
              <p className="text-[11px] text-text-3">{contacts.length} kişi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRemoveGroup}
              className="p-2 rounded-lg hover:bg-red-50 text-text-3 hover:text-red-500"
              title="Grubu sil"
            >
              <Trash2 size={14} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-2 text-text-3"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {contacts.length === 0 && editingId !== 'new' && (
            <p className="text-[12px] text-text-3 italic py-6 text-center">Bu grupta henüz kişi yok.</p>
          )}
          {contacts.map((c) => (
            editingId === c.id ? (
              <ContactForm key={c.id} draft={draft} setDraft={setDraft} onCancel={cancel} onSave={save} />
            ) : (
              <div key={c.id} className="border border-border/40 rounded-xl p-4 group hover:bg-surface-2/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold text-text">{c.name}</h3>
                    {c.role && <p className="text-[11px] text-text-3 mt-0.5">{c.role}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px] text-text-2">
                      {c.phone && <span className="inline-flex items-center gap-1.5"><Phone size={11} className="text-text-3" />{c.phone}</span>}
                      {c.email && <span className="inline-flex items-center gap-1.5"><Mail size={11} className="text-text-3" />{c.email}</span>}
                    </div>
                    {c.notes && <p className="text-[11px] text-text-3 mt-2 italic">{c.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => startEdit(c)} className="p-1.5 rounded hover:bg-surface-2 text-text-3 hover:text-text"><Pencil size={12} /></button>
                    <button onClick={() => onRemoveContact(c.id, c.name)} className="p-1.5 rounded hover:bg-red-50 text-text-3 hover:text-red-500"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            )
          ))}
          {editingId === 'new' && (
            <ContactForm draft={draft} setDraft={setDraft} onCancel={cancel} onSave={save} />
          )}
        </div>

        <div className="px-6 py-4 border-t border-border/40 flex justify-end">
          {editingId !== 'new' && (
            <button
              onClick={startNew}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-bold bg-[#1a1a19] text-white rounded-lg hover:bg-black"
            >
              <Plus size={14} /> Kişi ekle
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ContactForm: React.FC<{
  draft: ContactInput;
  setDraft: (next: ContactInput) => void;
  onCancel: () => void;
  onSave: () => void;
}> = ({ draft, setDraft, onCancel, onSave }) => (
  <div className="bg-surface-2/40 border border-border/40 rounded-xl p-4 space-y-2">
    <input
      type="text" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
      placeholder="Ad Soyad" autoFocus
      className="w-full px-3 py-2 text-[13px] rounded-lg bg-white border border-border/40 focus:outline-none focus:border-info-border"
    />
    <input
      type="text" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })}
      placeholder="Rol / unvan"
      className="w-full px-3 py-2 text-[13px] rounded-lg bg-white border border-border/40 focus:outline-none focus:border-info-border"
    />
    <div className="grid grid-cols-2 gap-2">
      <input
        type="text" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
        placeholder="Telefon"
        className="w-full px-3 py-2 text-[13px] rounded-lg bg-white border border-border/40 focus:outline-none focus:border-info-border"
      />
      <input
        type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })}
        placeholder="E-posta"
        className="w-full px-3 py-2 text-[13px] rounded-lg bg-white border border-border/40 focus:outline-none focus:border-info-border"
      />
    </div>
    <textarea
      value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
      placeholder="Notlar..." rows={2}
      className="w-full px-3 py-2 text-[13px] rounded-lg bg-white border border-border/40 focus:outline-none focus:border-info-border resize-y"
    />
    <div className="flex justify-end gap-2 pt-1">
      <button onClick={onCancel} className="px-3 py-1.5 text-[12px] font-bold border border-border/40 rounded-lg bg-white hover:bg-surface-2">Vazgeç</button>
      <button onClick={onSave} disabled={!draft.name.trim()} className="px-3 py-1.5 text-[12px] font-bold bg-[#1a1a19] text-white rounded-lg hover:bg-black disabled:opacity-50">Kaydet</button>
    </div>
  </div>
);
