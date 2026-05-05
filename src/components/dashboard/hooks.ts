import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { dbToLegacyId, ensureUsersLoaded, legacyToDbId } from '../../lib/users';
import type {
  Announcement, DirectoryContact, DirectoryGroup, IdentityCategory,
  IdentityEntry, Note, NoteCategory, Priority, QuickLink,
} from './types';
import { GROUP_COLOR_PALETTE, LINK_COLOR_PALETTE } from './types';

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// ─── DUYURULAR ──────────────────────────────────────────────────────────

type DbAnnouncement = {
  id: string;
  title: string;
  content: string | null;
  priority: Priority;
  created_by: string | null;
  created_at: string;
};

let announcementsCache: Announcement[] | null = null;
const announcementsListeners = new Set<(arr: Announcement[]) => void>();
const announcementsBroadcast = (next: Announcement[]) => {
  announcementsCache = next;
  announcementsListeners.forEach((cb) => cb(next));
};

const fetchAnnouncements = async (): Promise<Announcement[]> => {
  await ensureUsersLoaded();
  const { data, error } = await supabase
    .from('dashboard_announcements')
    .select('id, title, content, priority, created_by, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('announcements fetch failed', error);
    return [];
  }
  return ((data ?? []) as DbAnnouncement[]).map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content ?? '',
    priority: r.priority,
    createdById: r.created_by ? dbToLegacyId(r.created_by) ?? r.created_by : undefined,
    createdAt: r.created_at,
  }));
};

export function useAnnouncements(currentUserLegacyId: string) {
  const [items, setItems] = useState<Announcement[]>(announcementsCache ?? []);
  const [loading, setLoading] = useState(announcementsCache === null);

  useEffect(() => {
    const cb = (next: Announcement[]) => setItems(next);
    announcementsListeners.add(cb);
    if (announcementsCache === null) {
      fetchAnnouncements().then((list) => {
        announcementsBroadcast(list);
        setLoading(false);
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
    return () => { announcementsListeners.delete(cb); };
  }, []);

  const refresh = useCallback(async () => {
    const list = await fetchAnnouncements();
    announcementsBroadcast(list);
  }, []);

  const add = useCallback(async (input: { title: string; content: string; priority: Priority }) => {
    const id = newId();
    const now = new Date().toISOString();
    const optimistic: Announcement = {
      id, title: input.title, content: input.content, priority: input.priority,
      createdById: currentUserLegacyId, createdAt: now,
    };
    announcementsBroadcast([optimistic, ...(announcementsCache ?? [])]);
    const { error } = await supabase.from('dashboard_announcements').insert({
      id,
      title: input.title,
      content: input.content || null,
      priority: input.priority,
      created_by: legacyToDbId(currentUserLegacyId) ?? null,
    });
    if (error) { console.error('announcement insert failed', error); await refresh(); return false; }
    return true;
  }, [currentUserLegacyId, refresh]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    announcementsBroadcast((announcementsCache ?? []).filter((a) => a.id !== id));
    const { error } = await supabase.from('dashboard_announcements').delete().eq('id', id);
    if (error) { console.error('announcement delete failed', error); await refresh(); return false; }
    return true;
  }, [refresh]);

  return { items, loading, add, remove, refresh };
}

// ─── REHBER ─────────────────────────────────────────────────────────────

type DbDirectoryGroup = {
  id: string; name: string; color: string | null; position: number; created_at: string;
};
type DbDirectoryContact = {
  id: string; group_id: string; name: string; role: string | null;
  phone: string | null; email: string | null; notes: string | null;
  position: number; created_at: string;
};

type DirectoryState = { groups: DirectoryGroup[]; contacts: DirectoryContact[] };

let directoryCache: DirectoryState | null = null;
const directoryListeners = new Set<(s: DirectoryState) => void>();
const directoryBroadcast = (next: DirectoryState) => {
  directoryCache = next;
  directoryListeners.forEach((cb) => cb(next));
};

const fetchDirectory = async (): Promise<DirectoryState> => {
  const [gRes, cRes] = await Promise.all([
    supabase.from('dashboard_directory_groups').select('*').order('position').order('created_at'),
    supabase.from('dashboard_directory_contacts').select('*').order('position').order('created_at'),
  ]);
  if (gRes.error) console.error('directory_groups fetch failed', gRes.error);
  if (cRes.error) console.error('directory_contacts fetch failed', cRes.error);
  const groups = ((gRes.data ?? []) as DbDirectoryGroup[]).map((g): DirectoryGroup => ({
    id: g.id, name: g.name,
    color: g.color || GROUP_COLOR_PALETTE[0],
    position: g.position, createdAt: g.created_at,
  }));
  const contacts = ((cRes.data ?? []) as DbDirectoryContact[]).map((c): DirectoryContact => ({
    id: c.id, groupId: c.group_id, name: c.name,
    role: c.role ?? '', phone: c.phone ?? '', email: c.email ?? '',
    notes: c.notes ?? '', position: c.position, createdAt: c.created_at,
  }));
  return { groups, contacts };
};

export function useDirectory() {
  const [state, setState] = useState<DirectoryState>(directoryCache ?? { groups: [], contacts: [] });
  const [loading, setLoading] = useState(directoryCache === null);

  useEffect(() => {
    const cb = (next: DirectoryState) => setState(next);
    directoryListeners.add(cb);
    if (directoryCache === null) {
      fetchDirectory().then((s) => {
        directoryBroadcast(s);
        setLoading(false);
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
    return () => { directoryListeners.delete(cb); };
  }, []);

  const refresh = useCallback(async () => {
    const s = await fetchDirectory();
    directoryBroadcast(s);
  }, []);

  const addGroup = useCallback(async (name: string): Promise<boolean> => {
    const id = newId();
    const current = directoryCache ?? { groups: [], contacts: [] };
    const color = GROUP_COLOR_PALETTE[current.groups.length % GROUP_COLOR_PALETTE.length];
    const optimistic: DirectoryGroup = {
      id, name, color, position: current.groups.length, createdAt: new Date().toISOString(),
    };
    directoryBroadcast({ ...current, groups: [...current.groups, optimistic] });
    const { error } = await supabase.from('dashboard_directory_groups').insert({
      id, name, color, position: optimistic.position,
    });
    if (error) { console.error('group insert failed', error); await refresh(); return false; }
    return true;
  }, [refresh]);

  const removeGroup = useCallback(async (id: string): Promise<boolean> => {
    const current = directoryCache ?? { groups: [], contacts: [] };
    directoryBroadcast({
      groups: current.groups.filter((g) => g.id !== id),
      contacts: current.contacts.filter((c) => c.groupId !== id),
    });
    const { error } = await supabase.from('dashboard_directory_groups').delete().eq('id', id);
    if (error) { console.error('group delete failed', error); await refresh(); return false; }
    return true;
  }, [refresh]);

  const addContact = useCallback(async (
    groupId: string,
    input: { name: string; role: string; phone: string; email: string; notes: string }
  ): Promise<boolean> => {
    const id = newId();
    const current = directoryCache ?? { groups: [], contacts: [] };
    const groupContacts = current.contacts.filter((c) => c.groupId === groupId);
    const optimistic: DirectoryContact = {
      id, groupId, ...input, position: groupContacts.length, createdAt: new Date().toISOString(),
    };
    directoryBroadcast({ ...current, contacts: [...current.contacts, optimistic] });
    const { error } = await supabase.from('dashboard_directory_contacts').insert({
      id, group_id: groupId,
      name: input.name,
      role: input.role || null,
      phone: input.phone || null,
      email: input.email || null,
      notes: input.notes || null,
      position: optimistic.position,
    });
    if (error) { console.error('contact insert failed', error); await refresh(); return false; }
    return true;
  }, [refresh]);

  const updateContact = useCallback(async (
    id: string,
    patch: Partial<{ name: string; role: string; phone: string; email: string; notes: string }>
  ): Promise<boolean> => {
    const current = directoryCache ?? { groups: [], contacts: [] };
    directoryBroadcast({
      ...current,
      contacts: current.contacts.map((c) => c.id === id ? { ...c, ...patch } : c),
    });
    const dbPatch: Record<string, string | null> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.role !== undefined) dbPatch.role = patch.role || null;
    if (patch.phone !== undefined) dbPatch.phone = patch.phone || null;
    if (patch.email !== undefined) dbPatch.email = patch.email || null;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes || null;
    const { error } = await supabase.from('dashboard_directory_contacts').update(dbPatch).eq('id', id);
    if (error) { console.error('contact update failed', error); await refresh(); return false; }
    return true;
  }, [refresh]);

  const removeContact = useCallback(async (id: string): Promise<boolean> => {
    const current = directoryCache ?? { groups: [], contacts: [] };
    directoryBroadcast({ ...current, contacts: current.contacts.filter((c) => c.id !== id) });
    const { error } = await supabase.from('dashboard_directory_contacts').delete().eq('id', id);
    if (error) { console.error('contact delete failed', error); await refresh(); return false; }
    return true;
  }, [refresh]);

  return { ...state, loading, addGroup, removeGroup, addContact, updateContact, removeContact, refresh };
}

// ─── KÜNYE ──────────────────────────────────────────────────────────────

type DbIdentityEntry = {
  id: string; category: IdentityCategory; label: string; value: string; position: number;
};

let identityCache: IdentityEntry[] | null = null;
const identityListeners = new Set<(arr: IdentityEntry[]) => void>();
const identityBroadcast = (next: IdentityEntry[]) => {
  identityCache = next;
  identityListeners.forEach((cb) => cb(next));
};

const fetchIdentity = async (): Promise<IdentityEntry[]> => {
  const { data, error } = await supabase
    .from('dashboard_identity_entries')
    .select('id, category, label, value, position')
    .order('category')
    .order('position');
  if (error) { console.error('identity fetch failed', error); return []; }
  return (data ?? []) as DbIdentityEntry[];
};

export function useIdentity() {
  const [items, setItems] = useState<IdentityEntry[]>(identityCache ?? []);
  const [loading, setLoading] = useState(identityCache === null);

  useEffect(() => {
    const cb = (next: IdentityEntry[]) => setItems(next);
    identityListeners.add(cb);
    if (identityCache === null) {
      fetchIdentity().then((list) => {
        identityBroadcast(list);
        setLoading(false);
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
    return () => { identityListeners.delete(cb); };
  }, []);

  const refresh = useCallback(async () => {
    const list = await fetchIdentity();
    identityBroadcast(list);
  }, []);

  const add = useCallback(async (category: IdentityCategory, label: string, value: string): Promise<boolean> => {
    const id = newId();
    const current = identityCache ?? [];
    const sameCategory = current.filter((e) => e.category === category);
    const optimistic: IdentityEntry = { id, category, label, value, position: sameCategory.length };
    identityBroadcast([...current, optimistic]);
    const { error } = await supabase.from('dashboard_identity_entries').insert({
      id, category, label, value, position: optimistic.position,
    });
    if (error) { console.error('identity insert failed', error); await refresh(); return false; }
    return true;
  }, [refresh]);

  const update = useCallback(async (id: string, patch: { label?: string; value?: string }): Promise<boolean> => {
    identityBroadcast((identityCache ?? []).map((e) => e.id === id ? { ...e, ...patch } : e));
    const { error } = await supabase.from('dashboard_identity_entries').update(patch).eq('id', id);
    if (error) { console.error('identity update failed', error); await refresh(); return false; }
    return true;
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    identityBroadcast((identityCache ?? []).filter((e) => e.id !== id));
    const { error } = await supabase.from('dashboard_identity_entries').delete().eq('id', id);
    if (error) { console.error('identity delete failed', error); await refresh(); return false; }
    return true;
  }, [refresh]);

  return { items, loading, add, update, remove, refresh };
}

// ─── NOTLAR ─────────────────────────────────────────────────────────────

type DbNote = {
  id: string; category: NoteCategory; title: string; content: string | null;
  created_by: string | null; created_at: string; updated_at: string;
};

let notesCache: Note[] | null = null;
const notesListeners = new Set<(arr: Note[]) => void>();
const notesBroadcast = (next: Note[]) => {
  notesCache = next;
  notesListeners.forEach((cb) => cb(next));
};

const fetchNotes = async (): Promise<Note[]> => {
  await ensureUsersLoaded();
  const { data, error } = await supabase
    .from('dashboard_notes')
    .select('id, category, title, content, created_by, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (error) { console.error('notes fetch failed', error); return []; }
  return ((data ?? []) as DbNote[]).map((r) => ({
    id: r.id,
    category: r.category,
    title: r.title,
    content: r.content ?? '',
    createdById: r.created_by ? dbToLegacyId(r.created_by) ?? r.created_by : undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
};

export function useNotes(currentUserLegacyId: string) {
  const [items, setItems] = useState<Note[]>(notesCache ?? []);
  const [loading, setLoading] = useState(notesCache === null);

  useEffect(() => {
    const cb = (next: Note[]) => setItems(next);
    notesListeners.add(cb);
    if (notesCache === null) {
      fetchNotes().then((list) => {
        notesBroadcast(list);
        setLoading(false);
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
    return () => { notesListeners.delete(cb); };
  }, []);

  const refresh = useCallback(async () => {
    const list = await fetchNotes();
    notesBroadcast(list);
  }, []);

  const add = useCallback(async (category: NoteCategory, title: string, content: string): Promise<boolean> => {
    const id = newId();
    const now = new Date().toISOString();
    const optimistic: Note = {
      id, category, title, content,
      createdById: currentUserLegacyId, createdAt: now, updatedAt: now,
    };
    notesBroadcast([optimistic, ...(notesCache ?? [])]);
    const { error } = await supabase.from('dashboard_notes').insert({
      id, category, title,
      content: content || null,
      created_by: legacyToDbId(currentUserLegacyId) ?? null,
    });
    if (error) { console.error('note insert failed', error); await refresh(); return false; }
    return true;
  }, [currentUserLegacyId, refresh]);

  const update = useCallback(async (id: string, patch: { title?: string; content?: string }): Promise<boolean> => {
    notesBroadcast((notesCache ?? []).map((n) =>
      n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
    ));
    const dbPatch: Record<string, string | null> = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.content !== undefined) dbPatch.content = patch.content || null;
    const { error } = await supabase.from('dashboard_notes').update(dbPatch).eq('id', id);
    if (error) { console.error('note update failed', error); await refresh(); return false; }
    return true;
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    notesBroadcast((notesCache ?? []).filter((n) => n.id !== id));
    const { error } = await supabase.from('dashboard_notes').delete().eq('id', id);
    if (error) { console.error('note delete failed', error); await refresh(); return false; }
    return true;
  }, [refresh]);

  return { items, loading, add, update, remove, refresh };
}

// ─── HIZLI LİNKLER ──────────────────────────────────────────────────────

type DbQuickLink = {
  id: string;
  name: string;
  description: string | null;
  url: string;
  initial: string | null;
  color: string | null;
  position: number;
};

let quickLinksCache: QuickLink[] | null = null;
const quickLinksListeners = new Set<(arr: QuickLink[]) => void>();
const quickLinksBroadcast = (next: QuickLink[]) => {
  quickLinksCache = next;
  quickLinksListeners.forEach((cb) => cb(next));
};

const fetchQuickLinks = async (): Promise<QuickLink[]> => {
  const { data, error } = await supabase
    .from('dashboard_quick_links')
    .select('id, name, description, url, initial, color, position')
    .order('position', { ascending: true });
  if (error) { console.error('quick_links fetch failed', error); return []; }
  return ((data ?? []) as DbQuickLink[]).map((r): QuickLink => ({
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    url: r.url,
    initial: r.initial || (r.name[0]?.toUpperCase() ?? '?'),
    color: r.color || LINK_COLOR_PALETTE[0],
    position: r.position,
  }));
};

export function useQuickLinks() {
  const [items, setItems] = useState<QuickLink[]>(quickLinksCache ?? []);
  const [loading, setLoading] = useState(quickLinksCache === null);

  useEffect(() => {
    const cb = (next: QuickLink[]) => setItems(next);
    quickLinksListeners.add(cb);
    if (quickLinksCache === null) {
      fetchQuickLinks().then((list) => {
        quickLinksBroadcast(list);
        setLoading(false);
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
    return () => { quickLinksListeners.delete(cb); };
  }, []);

  const refresh = useCallback(async () => {
    const list = await fetchQuickLinks();
    quickLinksBroadcast(list);
  }, []);

  const add = useCallback(async (
    input: { name: string; description: string; url: string; initial?: string; color?: string }
  ): Promise<boolean> => {
    const id = newId();
    const current = quickLinksCache ?? [];
    const color = input.color || LINK_COLOR_PALETTE[current.length % LINK_COLOR_PALETTE.length];
    const initial = (input.initial?.trim() || input.name[0] || '?').toUpperCase();
    const optimistic: QuickLink = {
      id,
      name: input.name,
      description: input.description,
      url: input.url,
      initial,
      color,
      position: current.length,
    };
    quickLinksBroadcast([...current, optimistic]);
    const { error } = await supabase.from('dashboard_quick_links').insert({
      id,
      name: input.name,
      description: input.description || null,
      url: input.url,
      initial,
      color,
      position: optimistic.position,
    });
    if (error) { console.error('quick_link insert failed', error); await refresh(); return false; }
    return true;
  }, [refresh]);

  const update = useCallback(async (
    id: string,
    patch: Partial<{ name: string; description: string; url: string; initial: string; color: string }>
  ): Promise<boolean> => {
    const current = quickLinksCache ?? [];
    quickLinksBroadcast(current.map((l) => l.id === id ? { ...l, ...patch } : l));
    const dbPatch: Record<string, string | null> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.description !== undefined) dbPatch.description = patch.description || null;
    if (patch.url !== undefined) dbPatch.url = patch.url;
    if (patch.initial !== undefined) dbPatch.initial = patch.initial || null;
    if (patch.color !== undefined) dbPatch.color = patch.color;
    const { error } = await supabase.from('dashboard_quick_links').update(dbPatch).eq('id', id);
    if (error) { console.error('quick_link update failed', error); await refresh(); return false; }
    return true;
  }, [refresh]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    quickLinksBroadcast((quickLinksCache ?? []).filter((l) => l.id !== id));
    const { error } = await supabase.from('dashboard_quick_links').delete().eq('id', id);
    if (error) { console.error('quick_link delete failed', error); await refresh(); return false; }
    return true;
  }, [refresh]);

  // İki komşu satırın position değerlerini swap et — yukarı/aşağı taşıma.
  const reorder = useCallback(async (id: string, direction: 'up' | 'down'): Promise<boolean> => {
    const current = quickLinksCache ?? [];
    const idx = current.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= current.length) return false;
    const a = current[idx];
    const b = current[swapIdx];
    const next = [...current];
    next[idx] = { ...b, position: a.position };
    next[swapIdx] = { ...a, position: b.position };
    next.sort((x, y) => x.position - y.position);
    quickLinksBroadcast(next);
    const [r1, r2] = await Promise.all([
      supabase.from('dashboard_quick_links').update({ position: b.position }).eq('id', a.id),
      supabase.from('dashboard_quick_links').update({ position: a.position }).eq('id', b.id),
    ]);
    if (r1.error || r2.error) {
      console.error('quick_link reorder failed', r1.error || r2.error);
      await refresh();
      return false;
    }
    return true;
  }, [refresh]);

  return { items, loading, add, update, remove, reorder, refresh };
}
