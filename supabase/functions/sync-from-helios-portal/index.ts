// =====================================================================
// sync-from-helios-portal
// =====================================================================
// helios-portal Supabase projesinden seçili tabloları okur, ic-portal'ın
// `external_*` mirror tablolarına id'ye göre upsert eder. Cron tarafından
// 10 dakikada bir tetiklenir.
//
// Gerekli secret'lar (supabase secrets set ile):
//   HELIOS_PORTAL_URL          — helios-portal Project URL
//   HELIOS_PORTAL_SERVICE_KEY  — helios-portal service_role key
//
// Otomatik (Supabase tarafından sağlanır):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// =====================================================================

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

type TableSpec = {
  source: string;        // helios-portal tablo adı
  target: string;        // ic-portal mirror tablo adı (external_*)
  columns: string;       // select edilecek kolonlar (synced_at hariç)
};

const TABLES: TableSpec[] = [
  {
    source: 'accounting_ledger',
    target: 'external_accounting_ledger',
    columns: 'id, tarih, tip, aciklama, tutar, para_birimi, kategori, fatura_no, referans_id, created_at',
  },
  {
    source: 'customers',
    target: 'external_customers',
    columns: 'id, ad, tur, vergi_no, telefon, email, adres, notlar, satis_count, country, created_at',
  },
  {
    source: 'lab_inventory',
    target: 'external_lab_inventory',
    columns:
      'id, name, category, quantity, min_stock, unit, location, notes, model, serial, chem_type, cas, purity, storage, hazards, synthesis_date, mof_yield, color, appearance, created_at, updated_at',
  },
  {
    source: 'lab_history',
    target: 'external_lab_history',
    columns: 'id, action, item, detail, date, inventory_item_id',
  },
  {
    source: 'projects',
    target: 'external_projects',
    columns: 'id, name, no, program, budget, is_genel, created_at',
  },
  {
    source: 'project_expenses',
    target: 'external_project_expenses',
    columns:
      'id, project_id, tarih, belge_no, belge_tarih, kategori, aciklama, miktar, birim_fiyat, kdv_orani, tutar_kdv_haric, tutar_kdv_dahil, para_birimi, dus_om_bakiye, yurtdisi_alimi, notlar, created_at',
  },
  {
    source: 'sales_records',
    target: 'external_sales_records',
    columns:
      'id, tarih, fatura_no, musteri_id, musteri_adi, urun_hizmet_adi, kategori, miktar, birim, birim_fiyat, para_birimi, kdv_orani, tutar_kdv_haric, tutar_kdv_dahil, tahsilat_durumu, odeme_yontemi, notlar, fatura_tarihi, vade_tarihi, musteri_turu, musteri_vergi_no, yurtdisi, irsaliye_no, tahsilat_tarihi, tahsil_edilen, inventory_item_id, created_at',
  },
  {
    source: 'tahsilat_logs',
    target: 'external_tahsilat_logs',
    columns: 'id, satis_id, tutar, tarih, notlar, created_at',
  },
];

const PAGE_SIZE = 1000;

async function fetchAll(client: SupabaseClient, table: string, columns: string): Promise<unknown[]> {
  const rows: unknown[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await client.from(table).select(columns).range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`fetch ${table} failed: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

// Sadece id kolonu çek — orphan tespiti için. Tam satır çekmek gereksiz.
async function fetchAllIds(client: SupabaseClient, table: string): Promise<string[]> {
  const ids: string[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await client.from(table).select('id').range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`fetch ids from ${table} failed: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data as Array<{ id: string }>) ids.push(row.id);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return ids;
}

async function syncTable(
  source: SupabaseClient,
  target: SupabaseClient,
  spec: TableSpec
): Promise<{ table: string; upserted: number; deleted: number }> {
  const rows = await fetchAll(source, spec.source, spec.columns);
  const sourceIds = new Set((rows as Array<{ id: string }>).map((r) => r.id));

  // Mirror'daki id'leri çek; kaynakta olmayan satırlar = upstream'de silinmiş, bizde de silelim.
  const targetIds = await fetchAllIds(target, spec.target);
  const orphans = targetIds.filter((id) => !sourceIds.has(id));

  let deleted = 0;
  if (orphans.length > 0) {
    // .in() URL uzunluğu limitlerine takılmamak için chunk'la sil.
    const DELETE_CHUNK = 200;
    for (let i = 0; i < orphans.length; i += DELETE_CHUNK) {
      const chunk = orphans.slice(i, i + DELETE_CHUNK);
      const { error } = await target.from(spec.target).delete().in('id', chunk);
      if (error) throw new Error(`delete from ${spec.target} failed: ${error.message}`);
      deleted += chunk.length;
    }
  }

  if (rows.length === 0) return { table: spec.target, upserted: 0, deleted };

  // Stamp synced_at on every row so we know freshness per record.
  const stamped = (rows as Record<string, unknown>[]).map((r) => ({ ...r, synced_at: new Date().toISOString() }));

  // Upsert in chunks so we don't hit request size limits.
  const CHUNK = 500;
  for (let i = 0; i < stamped.length; i += CHUNK) {
    const chunk = stamped.slice(i, i + CHUNK);
    const { error } = await target.from(spec.target).upsert(chunk, { onConflict: 'id' });
    if (error) throw new Error(`upsert ${spec.target} failed: ${error.message}`);
  }

  return { table: spec.target, upserted: rows.length, deleted };
}

Deno.serve(async (_req) => {
  const helioPortalUrl = Deno.env.get('HELIOS_PORTAL_URL');
  const helioPortalKey = Deno.env.get('HELIOS_PORTAL_SERVICE_KEY');
  const icPortalUrl = Deno.env.get('SUPABASE_URL');
  const icPortalKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!helioPortalUrl || !helioPortalKey || !icPortalUrl || !icPortalKey) {
    return new Response(
      JSON.stringify({ ok: false, error: 'missing env: HELIOS_PORTAL_URL / HELIOS_PORTAL_SERVICE_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  const source = createClient(helioPortalUrl, helioPortalKey, { auth: { persistSession: false } });
  const target = createClient(icPortalUrl, icPortalKey, { auth: { persistSession: false } });

  // Open a sync_runs row up front so we always log, even on partial failure.
  const startedAt = new Date().toISOString();
  const { data: runRow, error: runErr } = await target
    .from('external_sync_runs')
    .insert({ started_at: startedAt })
    .select('id')
    .single();
  const runId = runRow?.id as number | undefined;
  if (runErr) console.error('sync_runs insert failed', runErr);

  const summary: Record<string, { upserted: number; deleted: number }> = {};
  const errors: string[] = [];

  try {
    for (const spec of TABLES) {
      try {
        const result = await syncTable(source, target, spec);
        summary[result.table] = { upserted: result.upserted, deleted: result.deleted };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${spec.target}: ${msg}`);
        console.error(msg);
      }
    }
  } catch (e) {
    // Catch fatal errors so the sync_runs row is always finalized below.
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`fatal: ${msg}`);
    console.error('fatal sync error', e);
  }

  const ok = errors.length === 0;
  if (runId !== undefined) {
    await target
      .from('external_sync_runs')
      .update({
        finished_at: new Date().toISOString(),
        ok,
        error_message: ok ? null : errors.join('\n'),
        rows_summary: summary,
      })
      .eq('id', runId);
  }

  return new Response(
    JSON.stringify({ ok, started_at: startedAt, summary, errors }),
    { status: ok ? 200 : 500, headers: { 'content-type': 'application/json' } }
  );
});
