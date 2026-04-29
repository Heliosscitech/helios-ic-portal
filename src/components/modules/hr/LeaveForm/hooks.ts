import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { dbToLegacyId, ensureUsersLoaded, legacyToDbId } from '../../../../lib/users';
import type { BelgeDurumu, LeaveFormState, LeaveReasonId, LeaveRequest } from './types';

// Year/month is hardcoded to April 2026 to match the LeaveForm UI calendar.
const YEAR = 2026;
const MONTH = 4;

const padDay = (d: number) => String(d).padStart(2, '0');
const dayToDateString = (day: number): string =>
  `${YEAR}-${String(MONTH).padStart(2, '0')}-${padDay(day)}`;
const dayToTimestamp = (day: number, hour = 0): string =>
  `${dayToDateString(day)}T${String(hour).padStart(2, '0')}:00:00Z`;
const isoToDay = (iso: string): number => parseInt(iso.split('-')[2].slice(0, 2), 10);

type DbLeave = {
  id: string;
  employee_id: string;
  department: string;
  manager_id: string;
  email: string;
  range_start: string;
  range_end: string;
  reason: LeaveReasonId;
  reason_detail: string | null;
  belge_status: BelgeDurumu;
  belge_path: string | null;
  belge_filename: string | null;
  telafi_notu: string | null;
  telafi_gunleri: string[] | null;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer_note: string | null;
  reviewed_at: string | null;
};

const SELECT =
  'id, employee_id, department, manager_id, email, range_start, range_end, reason, reason_detail, belge_status, belge_path, belge_filename, telafi_notu, telafi_gunleri, submitted_at, status, reviewer_note, reviewed_at';

const toLeave = (row: DbLeave): LeaveRequest => ({
  id: row.id,
  employeeId: dbToLegacyId(row.employee_id) ?? row.employee_id,
  departman: row.department,
  managerId: dbToLegacyId(row.manager_id) ?? row.manager_id,
  email: row.email,
  rangeStart: isoToDay(row.range_start),
  rangeEnd: isoToDay(row.range_end),
  reason: row.reason,
  reasonDetail: row.reason_detail ?? '',
  belge: row.belge_status,
  belgeFileName: row.belge_filename ?? undefined,
  belgePath: row.belge_path ?? undefined,
  telafiNotu: row.telafi_notu ?? '',
  telafiGunleri: (row.telafi_gunleri ?? []).map((d) => isoToDay(d)),
  submittedAt: new Date(row.submitted_at).getTime(),
  status: row.status,
  reviewerNote: row.reviewer_note ?? undefined,
  reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).getTime() : undefined,
});

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

let cache: LeaveRequest[] | null = null;
const listeners = new Set<(reqs: LeaveRequest[]) => void>();
const broadcast = (next: LeaveRequest[]) => {
  cache = next;
  listeners.forEach((cb) => cb(next));
};

const fetchAll = async (): Promise<LeaveRequest[]> => {
  await ensureUsersLoaded();
  const { data, error } = await supabase
    .from('leave_requests')
    .select(SELECT)
    .order('submitted_at', { ascending: false });
  if (error) {
    console.error('leave_requests fetch failed', error);
    return cache ?? [];
  }
  return ((data ?? []) as DbLeave[]).map(toLeave);
};

const uploadBelge = async (
  userDbId: string,
  requestId: string,
  filename: string,
  dataUrl: string
): Promise<{ path: string | null; error: Error | null }> => {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const path = `${userDbId}/${requestId}/${filename}`;
    const { error } = await supabase.storage
      .from('leave-documents')
      .upload(path, blob, { upsert: true, contentType: blob.type || 'application/octet-stream' });
    if (error) {
      console.error('storage upload failed', error, 'path:', path, 'blob.type:', blob.type, 'size:', blob.size);
      return { path: null, error };
    }
    return { path, error: null };
  } catch (e) {
    return { path: null, error: e as Error };
  }
};

export const getBelgeDownloadUrl = async (path: string): Promise<string | null> => {
  const { data, error } = await supabase.storage
    .from('leave-documents')
    .createSignedUrl(path, 60 * 60); // 1 saat
  if (error) {
    console.error('createSignedUrl failed', error);
    return null;
  }
  return data.signedUrl;
};

export function useLeaveRequests() {
  const [requests, setRequests] = useState<LeaveRequest[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    const cb = (next: LeaveRequest[]) => setRequests(next);
    listeners.add(cb);
    if (cache === null) {
      fetchAll().then((list) => {
        broadcast(list);
        setLoading(false);
      });
    } else {
      setRequests(cache);
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

  const submitRequest = useCallback(
    async (form: LeaveFormState, employeeLegacyId: string): Promise<LeaveRequest | null> => {
      await ensureUsersLoaded();
      const employeeDbId = legacyToDbId(employeeLegacyId);
      const managerDbId = legacyToDbId(form.managerId);
      if (!employeeDbId || !managerDbId) {
        window.alert('Talep gönderilemedi: kullanıcı eşleşmesi yapılamadı.');
        return null;
      }

      const id = newId();
      const start = dayToTimestamp(form.rangeStart);
      const end = dayToTimestamp(form.rangeEnd || form.rangeStart, 23);

      let belgePath: string | null = null;
      if (form.belgeFileDataUrl && form.belgeFileName) {
        const { path, error } = await uploadBelge(
          employeeDbId,
          id,
          form.belgeFileName,
          form.belgeFileDataUrl
        );
        if (error) {
          window.alert('Belge yüklenemedi:\n' + error.message);
          return null;
        }
        belgePath = path;
      }

      const dbRow = {
        id,
        employee_id: employeeDbId,
        department: form.departman,
        manager_id: managerDbId,
        email: form.email,
        range_start: start,
        range_end: end,
        reason: form.reason,
        reason_detail: form.reasonDetail || null,
        belge_status: form.belge,
        belge_path: belgePath,
        belge_filename: form.belgeFileName || null,
        telafi_notu: form.telafiNotu || null,
        telafi_gunleri: form.telafiGunleri.map((d) => dayToDateString(d)),
        status: 'pending' as const,
      };

      const { error } = await supabase.from('leave_requests').insert(dbRow);
      if (error) {
        console.error('leave_requests insert failed', error, 'sent dbRow:', dbRow);
        window.alert(
          'Talep kaydedilemedi:\n' +
            (error.message || 'bilinmeyen') +
            '\n\nDetay (console\'da da var): ' +
            JSON.stringify(error)
        );
        return null;
      }

      await refresh();
      return cache?.find((r) => r.id === id) ?? null;
    },
    [refresh]
  );

  const decideRequest = useCallback(
    async (
      requestId: string,
      decision: 'approved' | 'rejected',
      note: string,
      reviewerLegacyId: string
    ): Promise<boolean> => {
      const reviewerDbId = legacyToDbId(reviewerLegacyId);
      if (!reviewerDbId) {
        window.alert('Karar uygulanamadı: kullanıcı bulunamadı.');
        return false;
      }

      // optimistic
      broadcast(
        (cache ?? []).map((r) =>
          r.id === requestId
            ? {
                ...r,
                status: decision,
                reviewerNote: note.trim() || undefined,
                reviewedAt: Date.now(),
              }
            : r
        )
      );

      const { error, count } = await supabase
        .from('leave_requests')
        .update(
          {
            status: decision,
            reviewer_note: note.trim() || null,
            reviewed_at: new Date().toISOString(),
            reviewed_by: reviewerDbId,
          },
          { count: 'exact' }
        )
        .eq('id', requestId);

      if (error) {
        console.error('decideRequest failed', error);
        window.alert('Karar uygulanamadı:\n' + error.message);
        await refresh();
        return false;
      }
      if (count === 0) {
        window.alert('Bu talebe karar verme yetkiniz yok.');
        await refresh();
        return false;
      }
      return true;
    },
    [refresh]
  );

  return { requests, loading, submitRequest, decideRequest, refresh };
}
