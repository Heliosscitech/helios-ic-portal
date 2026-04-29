import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import {
  dbToLegacyId,
  ensureUsersLoaded,
  getCachedUsers,
  legacyToDbId,
} from '../../../../lib/users';
import type {
  PurchaseAttachment,
  PurchaseAuthor,
  PurchaseDetails,
  PurchaseRequest,
  PurchaseStatus,
  PurchaseType,
  Urgency,
} from './types';

type DbPurchase = {
  id: string;
  type: PurchaseType;
  title: string;
  description: string | null;
  link: string | null;
  estimated_price: string | null;
  urgency: Urgency;
  quantity: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  attachment_mime: string | null;
  status: PurchaseStatus;
  created_by: string;
  assigned_to: string | null;
  details_kind: PurchaseType | null;
  details: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

const SELECT =
  'id, type, title, description, link, estimated_price, urgency, quantity, attachment_path, attachment_name, attachment_size, attachment_mime, status, created_by, assigned_to, details_kind, details, created_at, updated_at';

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const userToAuthor = (legacyId: string | null): PurchaseAuthor | undefined => {
  if (!legacyId) return undefined;
  const u = getCachedUsers().find((x) => x.id === legacyId);
  if (!u) return { id: legacyId, name: legacyId, initials: '??', color: 'bg-surface-2 text-text-3' };
  return { id: u.id, name: u.name, initials: u.initials, color: u.color };
};

const toPurchase = (row: DbPurchase): PurchaseRequest => {
  const creatorLegacy = dbToLegacyId(row.created_by);
  const assigneeLegacy = row.assigned_to ? dbToLegacyId(row.assigned_to) : null;

  let attachment: PurchaseAttachment | undefined;
  if (row.attachment_path && row.attachment_name) {
    attachment = {
      name: row.attachment_name,
      size: row.attachment_size ?? 0,
      type: row.attachment_mime ?? 'application/octet-stream',
      // dataUrl ileride signed URL ile değiştirilir; şimdilik path'i tutuyoruz
      dataUrl: row.attachment_path,
    };
  }

  let details: PurchaseDetails | undefined;
  if (row.details_kind && row.details) {
    details = { kind: row.details_kind, ...row.details } as PurchaseDetails;
  } else if (row.details_kind) {
    details = { kind: row.details_kind } as PurchaseDetails;
  }

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description ?? '',
    link: row.link ?? undefined,
    estimatedPrice: row.estimated_price ?? undefined,
    urgency: row.urgency,
    quantity: row.quantity ?? undefined,
    attachment,
    status: row.status,
    createdBy: userToAuthor(creatorLegacy ?? null) ?? {
      id: row.created_by,
      name: 'Bilinmeyen',
      initials: '??',
      color: 'bg-surface-2 text-text-3',
    },
    createdAt: row.created_at,
    assignedTo: userToAuthor(assigneeLegacy ?? null),
    details,
  };
};

const uploadAttachment = async (
  ownerDbId: string,
  requestId: string,
  attachment: PurchaseAttachment
): Promise<{ path: string | null; error: Error | null }> => {
  try {
    const res = await fetch(attachment.dataUrl);
    const blob = await res.blob();
    const path = `${ownerDbId}/${requestId}/${attachment.name}`;
    const { error } = await supabase.storage
      .from('purchase-attachments')
      .upload(path, blob, { upsert: true, contentType: attachment.type || 'application/octet-stream' });
    if (error) return { path: null, error };
    return { path, error: null };
  } catch (e) {
    return { path: null, error: e as Error };
  }
};

export const getPurchaseAttachmentUrl = async (path: string): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from('purchase-attachments')
    .createSignedUrl(path, 60 * 60);
  if (error) {
    console.error('purchase attachment signed url failed', error);
    return null;
  }
  return data.signedUrl;
};

let cache: PurchaseRequest[] | null = null;
const listeners = new Set<(reqs: PurchaseRequest[]) => void>();
const broadcast = (next: PurchaseRequest[]) => {
  cache = next;
  listeners.forEach((cb) => cb(next));
};

const fetchAll = async (): Promise<PurchaseRequest[]> => {
  await ensureUsersLoaded();
  const { data, error } = await supabase
    .from('purchase_requests')
    .select(SELECT)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('purchase_requests fetch failed', error);
    return cache ?? [];
  }
  return ((data ?? []) as DbPurchase[]).map(toPurchase);
};

export type NewPurchaseInput = {
  type: PurchaseType;
  title: string;
  description: string;
  link?: string;
  estimatedPrice?: string;
  urgency: Urgency;
  quantity?: string;
  attachment?: PurchaseAttachment;
  assignedTo?: PurchaseAuthor;
  details?: PurchaseDetails;
};

export function usePurchases() {
  const [purchases, setPurchases] = useState<PurchaseRequest[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    const cb = (next: PurchaseRequest[]) => setPurchases(next);
    listeners.add(cb);
    if (cache === null) {
      fetchAll().then((list) => {
        broadcast(list);
        setLoading(false);
      });
    } else {
      setPurchases(cache);
      setLoading(false);
    }
    return () => {
      listeners.delete(cb);
    };
  }, []);

  const refresh = useCallback(async () => {
    const list = await fetchAll();
    broadcast(list);
  }, []);

  const addPurchase = useCallback(
    async (input: NewPurchaseInput, creatorLegacyId: string): Promise<PurchaseRequest | null> => {
      await ensureUsersLoaded();
      const creatorDbId = legacyToDbId(creatorLegacyId);
      if (!creatorDbId) {
        window.alert('Talep gönderilemedi: kullanıcı bulunamadı.');
        return null;
      }

      const id = newId();
      let attachmentPath: string | null = null;

      if (input.attachment) {
        const up = await uploadAttachment(creatorDbId, id, input.attachment);
        if (up.error) {
          window.alert('Ek dosya yüklenemedi:\n' + up.error.message);
          return null;
        }
        attachmentPath = up.path;
      }

      const assigneeDbId = input.assignedTo ? legacyToDbId(input.assignedTo.id) ?? null : null;
      const detailsKind = input.details?.kind ?? null;
      const detailsRest = input.details
        ? Object.fromEntries(Object.entries(input.details).filter(([k]) => k !== 'kind'))
        : {};

      const dbRow = {
        id,
        type: input.type,
        title: input.title,
        description: input.description || null,
        link: input.link || null,
        estimated_price: input.estimatedPrice || null,
        urgency: input.urgency,
        quantity: input.quantity || null,
        attachment_path: attachmentPath,
        attachment_name: input.attachment?.name ?? null,
        attachment_size: input.attachment?.size ?? null,
        attachment_mime: input.attachment?.type ?? null,
        status: 'yeni' as const,
        created_by: creatorDbId,
        assigned_to: assigneeDbId,
        details_kind: detailsKind,
        details: detailsRest,
      };

      const { error } = await supabase.from('purchase_requests').insert(dbRow);
      if (error) {
        console.error('purchase insert failed', error);
        window.alert('Talep kaydedilemedi:\n' + (error.message || JSON.stringify(error)));
        return null;
      }

      await refresh();
      return cache?.find((p) => p.id === id) ?? null;
    },
    [refresh]
  );

  const updateStatus = useCallback(
    async (id: string, status: PurchaseStatus): Promise<boolean> => {
      // optimistic
      broadcast(
        (cache ?? []).map((p) => (p.id === id ? { ...p, status } : p))
      );
      const { error, count } = await supabase
        .from('purchase_requests')
        .update({ status }, { count: 'exact' })
        .eq('id', id);
      if (error) {
        console.error('purchase updateStatus failed', error);
        window.alert('Durum güncellenemedi:\n' + error.message);
        await refresh();
        return false;
      }
      if (count === 0) {
        window.alert(
          'Bu talebin durumunu güncelleme yetkiniz yok.\nSadece "Satın alma sorumlusu" veya yönetici durum değiştirebilir.'
        );
        await refresh();
        return false;
      }
      return true;
    },
    [refresh]
  );

  const deletePurchase = useCallback(
    async (id: string): Promise<boolean> => {
      broadcast((cache ?? []).filter((p) => p.id !== id));
      const { error, count } = await supabase
        .from('purchase_requests')
        .delete({ count: 'exact' })
        .eq('id', id);
      if (error) {
        console.error('purchase delete failed', error);
        window.alert('Silinemedi:\n' + error.message);
        await refresh();
        return false;
      }
      if (count === 0) {
        window.alert('Bu talebi silme yetkiniz yok.');
        await refresh();
        return false;
      }
      return true;
    },
    [refresh]
  );

  return { purchases, loading, addPurchase, updateStatus, deletePurchase, refresh };
}
