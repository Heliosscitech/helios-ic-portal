import React, { useEffect, useRef, useState } from 'react';
import { X, Trash2, Plus, Send, Calendar, Tag, ChevronDown, CheckSquare, Link2, Save, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../../../../lib/utils';
import { usePortalUsers, getCachedUsers } from '../../../../../lib/users';
import { confirmAction } from '../../../../../lib/confirm';
import { formatRelative } from '../../../../../lib/dates';
import { DL_COLUMNS, formatDate } from '../types';
import type { DLComment, DLGroup, DLItem, DLStatus } from '../types';
import { useDLComments, useDLSubtasks, useDLLinkedItems } from '../hooks';
import type { User } from '../../../../../types/portal';

interface ItemDetailModalProps {
  item:        DLItem;
  groupTitle:  string;
  currentUser: User;
  allItems:    DLItem[];
  allGroups:   Pick<DLGroup, 'id' | 'title'>[];
  onClose:     () => void;
  onUpdate:    (
    id:              string,
    patch:           Partial<Pick<DLItem, 'title' | 'notes' | 'status' | 'dueDate' | 'tags'>>,
    newAssigneeIds?: string[]
  ) => void;
  onDelete:    (id: string) => void;
}

// ── Inline editable text ───────────────────────────────────────────────────────

interface InlineEditProps {
  value:        string;
  onChange:     (v: string) => void;
  className?:   string;
  placeholder?: string;
  multiline?:   boolean;
}

const InlineEdit: React.FC<InlineEditProps> = ({ value, onChange, className, placeholder, multiline }) => {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  const commit = () => {
    setEditing(false);
    onChange(draft.trim() || value);
  };

  if (!editing) {
    return (
      <div
        onClick={() => { setDraft(value); setEditing(true); setTimeout(() => ref.current?.focus(), 0); }}
        className={cn('cursor-text rounded-lg hover:bg-surface-2/60 transition-colors wrap-break-word whitespace-pre-wrap', className)}
      >
        {value || <span className="text-text-3 italic">{placeholder}</span>}
      </div>
    );
  }

  const sharedProps = {
    ref: ref as React.RefObject<never>,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!multiline && e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { setDraft(value); setEditing(false); }
    },
    className: cn('w-full bg-white border border-info-border rounded-lg outline-none focus:ring-2 focus:ring-info-border/20 resize-none', className),
  };

  return multiline
    ? <textarea rows={4} autoFocus {...sharedProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>} />
    : <input    autoFocus {...sharedProps as React.InputHTMLAttributes<HTMLInputElement>} />;
};

// ── Comment item ───────────────────────────────────────────────────────────────

const CommentItem: React.FC<{ comment: DLComment }> = ({ comment }) => {
  const users = getCachedUsers();
  const author = users.find((u) => u.id === comment.authorId);

  return (
    <div className="flex gap-3 py-3 border-b border-border/30 last:border-0">
      {author?.avatarUrl ? (
        <img src={author.avatarUrl} alt={author.name} className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
      ) : (
        <div className={cn('w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5', author?.color ?? 'bg-surface-2 text-text-3')}>
          {author?.initials ?? '?'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[12px] font-semibold text-text">{author?.name ?? 'Bilinmiyor'}</span>
          <span className="text-[11px] text-text-3">{formatRelative(comment.createdAt)}</span>
        </div>
        <p className="text-[13px] text-text-2 leading-snug whitespace-pre-wrap">{comment.body}</p>
      </div>
    </div>
  );
};

// ── Main modal ─────────────────────────────────────────────────────────────────

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  groupTitle,
  currentUser,
  allItems,
  allGroups,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const { users } = usePortalUsers();
  const { comments, addComment }                               = useDLComments(item.id);
  const { subtasks, addSubtask, toggleSubtask, deleteSubtask } = useDLSubtasks(item.id);
  const { linkedIds, addLink, removeLink }                     = useDLLinkedItems(item.id);

  // ── Editable local state (saved explicitly) ────────────────────────────────
  const [localTitle,     setLocalTitle]     = useState(item.title);
  const [localNotes,     setLocalNotes]     = useState(item.notes ?? '');
  const [localStatus,    setLocalStatus]    = useState<DLStatus>(item.status);
  const [localAssignees, setLocalAssignees] = useState<string[]>(item.assigneeIds);
  const [localDueDate,   setLocalDueDate]   = useState(item.dueDate ?? '');
  const [localTags,      setLocalTags]      = useState<string[]>(item.tags);

  const [tagDraft,      setTagDraft]      = useState('');
  const [subtaskDraft,  setSubtaskDraft]  = useState('');
  const [commentBody,   setCommentBody]   = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [justSaved,     setJustSaved]     = useState(false);
  const [isDirty,       setIsDirty]       = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const markDirty = () => setIsDirty(true);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    await onUpdate(
      item.id,
      {
        title:   localTitle.trim() || item.title,
        notes:   localNotes.trim() || undefined,
        status:  localStatus,
        dueDate: localDueDate || null,
        tags:    localTags,
      },
      localAssignees
    );
    setSaving(false);
    setIsDirty(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  const handleDelete = async () => {
    const ok = await confirmAction({
      title: 'Ögeyi sil?',
      message: `"${item.title}" kalıcı olarak silinecek.`,
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (ok) { onDelete(item.id); onClose(); }
  };

  const handleSendComment = async () => {
    if (!commentBody.trim() || submitting) return;
    setSubmitting(true);
    await addComment(commentBody, currentUser.id);
    setCommentBody('');
    setSubmitting(false);
  };

  const handleAddSubtask = async () => {
    if (!subtaskDraft.trim()) return;
    await addSubtask(subtaskDraft.trim());
    setSubtaskDraft('');
  };

  const addTag = () => {
    const t = tagDraft.trim().toLowerCase();
    if (!t || localTags.includes(t)) { setTagDraft(''); return; }
    setLocalTags((p) => [...p, t]);
    setTagDraft('');
    markDirty();
  };

  const removeTag = (t: string) => { setLocalTags((p) => p.filter((x) => x !== t)); markDirty(); };

  const toggleAssignee = (uid: string) => {
    setLocalAssignees((p) => p.includes(uid) ? p.filter((id) => id !== uid) : [...p, uid]);
    markDirty();
  };

  const colDot = DL_COLUMNS.find((c) => c.id === localStatus)?.dot ?? 'bg-gray-400';
  const completedCount = subtasks.filter((s) => s.completed).length;

  const linkableItems = allItems.filter((i) => i.id !== item.id && !linkedIds.includes(i.id));
  const getGroupTitle = (groupId: string) => allGroups.find((g) => g.id === groupId)?.title ?? '';

  return (
    <div
      className="fixed inset-0 z-10000 bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 px-6 py-3.5 border-b border-border/40 shrink-0">
          <span className="text-[11px] text-text-3 font-mono bg-surface-2 px-2 py-0.5 rounded">
            {groupTitle}
          </span>

          <div className="flex-1" />

          {/* Save feedback */}
          {justSaved && !isDirty && (
            <span className="flex items-center gap-1 text-[12px] font-semibold text-teal-600">
              <Check size={13} /> Kaydedildi
            </span>
          )}

          {/* Save button — only when dirty */}
          {isDirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold bg-[#1a1a19] text-white rounded-lg hover:bg-black transition-colors disabled:opacity-60"
            >
              {saving
                ? <><Loader2 size={13} className="animate-spin" /> Kaydediliyor</>
                : <><Save size={13} /> Kaydet</>
              }
            </button>
          )}

          <button
            onClick={handleDelete}
            className="p-1.5 text-text-3 hover:text-red-text hover:bg-red-bg rounded-lg transition-colors"
            title="Ögeyi sil"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left: title, description, subtasks, links, comments */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-border/40">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* Title */}
              <InlineEdit
                value={localTitle}
                onChange={(v) => { setLocalTitle(v); markDirty(); }}
                placeholder="Başlık..."
                className="text-[20px] font-bold text-text leading-tight px-2 py-1.5"
              />

              {/* Description */}
              <div>
                <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wide mb-2">Açıklama</p>
                <InlineEdit
                  value={localNotes}
                  onChange={(v) => { setLocalNotes(v); markDirty(); }}
                  placeholder="Açıklama eklemek için tıkla..."
                  multiline
                  className="text-[13.5px] text-text-2 leading-relaxed px-2 py-1.5 min-h-15"
                />
              </div>

              {/* Alt Görevler */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare size={13} className="text-text-3" />
                  <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wide flex-1">Alt Görevler</p>
                  {subtasks.length > 0 && (
                    <span className="text-[10.5px] font-mono text-text-3 bg-surface-2 px-1.5 py-0.5 rounded-full">
                      {completedCount}/{subtasks.length}
                    </span>
                  )}
                </div>

                {subtasks.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {subtasks.map((st) => (
                      <div key={st.id} className="flex items-center gap-2 group/st py-1 px-2 rounded-lg hover:bg-surface-2/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={(e) => toggleSubtask(st.id, e.target.checked)}
                          className="w-3.5 h-3.5 rounded shrink-0 accent-teal-600 cursor-pointer"
                        />
                        <span className={cn('flex-1 text-[13px] leading-snug', st.completed && 'line-through text-text-3')}>
                          {st.title}
                        </span>
                        <button
                          onClick={() => deleteSubtask(st.id)}
                          className="opacity-0 group-hover/st:opacity-100 p-0.5 text-text-3 hover:text-red-text transition-all"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-1.5">
                  <input
                    value={subtaskDraft}
                    onChange={(e) => setSubtaskDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                    placeholder="Alt görev ekle..."
                    className="flex-1 px-2.5 py-1.5 text-[12.5px] border border-border rounded-lg outline-none focus:border-info-border transition-colors bg-white"
                  />
                  <button
                    onClick={handleAddSubtask}
                    disabled={!subtaskDraft.trim()}
                    className="p-1.5 text-info-text hover:bg-info-bg border border-border rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Bağlanan Biletler */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link2 size={13} className="text-text-3" />
                  <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wide">Bağlanan Biletler</p>
                </div>

                {linkedIds.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {linkedIds.map((lid) => {
                      const linked = allItems.find((i) => i.id === lid);
                      if (!linked) return null;
                      const dot = DL_COLUMNS.find((c) => c.id === linked.status)?.dot ?? 'bg-gray-400';
                      return (
                        <div key={lid} className="flex items-center gap-2 group/link py-1.5 px-2 rounded-lg hover:bg-surface-2/50 border border-border/30 transition-colors">
                          <div className={cn('w-2 h-2 rounded-full shrink-0', dot)} />
                          <div className="flex-1 min-w-0">
                            <span className="text-[12.5px] font-medium text-text truncate block">{linked.title}</span>
                            <span className="text-[10.5px] text-text-3">{getGroupTitle(linked.groupId)}</span>
                          </div>
                          <button
                            onClick={() => removeLink(lid)}
                            className="opacity-0 group-hover/link:opacity-100 p-0.5 text-text-3 hover:text-red-text transition-all shrink-0"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {linkableItems.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) addLink(e.target.value); }}
                    className="w-full px-2.5 py-1.5 text-[12.5px] border border-border rounded-lg outline-none focus:border-info-border transition-colors bg-white text-text-3 cursor-pointer"
                  >
                    <option value="">+ Bilet bağla...</option>
                    {linkableItems.map((i) => (
                      <option key={i.id} value={i.id}>
                        [{getGroupTitle(i.groupId)}] {i.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Comments */}
              <div>
                <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wide mb-3">
                  Yorumlar
                  {comments.length > 0 && (
                    <span className="ml-2 font-mono normal-case">{comments.length}</span>
                  )}
                </p>

                {comments.length === 0 ? (
                  <p className="text-[12.5px] text-text-3 italic px-1">Henüz yorum yok.</p>
                ) : (
                  <div>
                    {comments.map((c) => <CommentItem key={c.id} comment={c} />)}
                    <div ref={commentsEndRef} />
                  </div>
                )}
              </div>
            </div>

            {/* Comment input */}
            <div className="px-6 py-4 border-t border-border/40 shrink-0">
              <div className="flex gap-3 items-end">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-7 h-7 rounded-full object-cover shrink-0 mb-0.5" />
                ) : (
                  <div className={cn('w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 mb-0.5', currentUser.color)}>
                    {currentUser.initials}
                  </div>
                )}
                <div className="flex-1 flex items-end gap-2 border border-border rounded-xl px-3 py-2 focus-within:border-info-border focus-within:ring-2 focus-within:ring-info-border/20 transition-all bg-white">
                  <textarea
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                    placeholder="Yorum yaz... (Enter gönderir)"
                    rows={1}
                    className="flex-1 text-[13px] bg-transparent outline-none resize-none leading-snug"
                  />
                  <button
                    onClick={handleSendComment}
                    disabled={!commentBody.trim() || submitting}
                    className="p-1 text-info-text hover:bg-info-bg rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="w-64 shrink-0 overflow-y-auto px-5 py-5 space-y-5">

            {/* Status */}
            <div>
              <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wide mb-2">Durum</p>
              <div className="relative">
                <select
                  value={localStatus}
                  onChange={(e) => { setLocalStatus(e.target.value as DLStatus); markDirty(); }}
                  className="w-full appearance-none pl-7 pr-8 py-2 text-[12.5px] font-semibold border border-border rounded-lg bg-white outline-none focus:border-info-border transition-colors cursor-pointer"
                >
                  {DL_COLUMNS.map((col) => (
                    <option key={col.id} value={col.id}>{col.label}</option>
                  ))}
                </select>
                <div className={cn('absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full', colDot)} />
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none" />
              </div>
            </div>

            {/* Assignees */}
            <div>
              <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wide mb-2">Atananlar</p>
              <div className="flex flex-wrap gap-1.5">
                {users.map((u) => {
                  const selected = localAssignees.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleAssignee(u.id)}
                      title={u.name}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-semibold border transition-all',
                        selected
                          ? 'bg-info-bg border-info-border text-info-text'
                          : 'bg-surface-2 border-border text-text-3 hover:border-border-strong'
                      )}
                    >
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.name} className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <div className={cn('w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center shrink-0', u.color)}>
                          {u.initials}
                        </div>
                      )}
                      {u.name.split(' ')[0]}
                    </button>
                  );
                })}
                {users.length === 0 && <span className="text-[12px] text-text-3">—</span>}
              </div>
            </div>

            {/* Due date */}
            <div>
              <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wide mb-2">
                <Calendar size={11} className="inline mr-1" />Bitiş tarihi
              </p>
              <input
                type="date"
                value={localDueDate}
                onChange={(e) => { setLocalDueDate(e.target.value); markDirty(); }}
                className="w-full px-3 py-2 text-[12.5px] border border-border rounded-lg bg-white outline-none focus:border-info-border transition-colors font-mono"
              />
              {localDueDate && (
                <button
                  onClick={() => { setLocalDueDate(''); markDirty(); }}
                  className="mt-1 text-[11px] text-text-3 hover:text-red-text transition-colors"
                >
                  Tarihi kaldır
                </button>
              )}
            </div>

            {/* Tags */}
            <div>
              <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wide mb-2">
                <Tag size={11} className="inline mr-1" />Etiketler
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {localTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 bg-surface-2 border border-border text-[11px] text-text-2 font-semibold px-2 py-0.5 rounded-full"
                  >
                    {t}
                    <button onClick={() => removeTag(t)} className="text-text-3 hover:text-red-text transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5">
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Etiket ekle..."
                  className="flex-1 px-2.5 py-1.5 text-[12px] border border-border rounded-lg outline-none focus:border-info-border transition-colors bg-white"
                />
                <button
                  onClick={addTag}
                  disabled={!tagDraft.trim()}
                  className="p-1.5 text-info-text hover:bg-info-bg border border-border rounded-lg transition-colors disabled:opacity-40"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Parent group */}
            <div>
              <p className="text-[11px] font-semibold text-text-3 uppercase tracking-wide mb-1.5">Üst Öğe</p>
              <span className="inline-block bg-purple-50 border border-purple-200 text-purple-700 text-[12px] font-semibold px-2.5 py-1 rounded-full">
                {groupTitle}
              </span>
            </div>

            {/* Meta */}
            <div className="pt-2 border-t border-border/40 space-y-2">
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="text-text-3">Oluşturulma</span>
                <span className="text-text-2 font-medium">{formatDate(item.createdAt.split('T')[0])}</span>
              </div>
              {localDueDate && (
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="text-text-3">Bitiş</span>
                  <span className="text-text-2 font-medium">{formatDate(localDueDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
