import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { toast } from '../../../../lib/toast';
import { dbToLegacyId, legacyToDbId } from '../../../../lib/users';
import type {
  Experiment,
  ExperimentCharacterization,
  ExperimentMaterial,
  LiteratureItem,
  MofCategory,
  ShapingVariant,
  SubExperimentType,
  Training,
} from './types';

// ── DB row tipleri ───────────────────────────────────────────────────────────

type CategoryRow = { id: string; name: string; position: number; created_at: string };

type ExperimentRow = {
  id: string;
  mof_category_id: string;
  shaping_variant_id: string | null;
  parent_id: string | null;
  sub_type: string | null;
  title: string;
  batch_no: string;
  reference_url: string | null;
  author_id: string | null;
  experiment_date: string;
  yield_pct: number | string | null;
  amount: string | null;
  repeat_reason: string | null;
  scale_up_detail: string | null;
  parameter_detail: string | null;
  general_overview: string | null;
  reason_diff: string | null;
  procedure_equipment: string | null;
  plan_results: string | null;
  created_at: string;
};

type MaterialRow = {
  id: string; experiment_id: string; name: string; amount: string | null;
  position: number; created_at: string;
};

type CharacterizationRow = {
  id: string; experiment_id: string; type: string; value: string | null;
  notes: string | null; attachment_url: string | null; image_url: string | null;
  performed_at: string | null; performed_by_id: string | null;
  position: number; created_at: string;
};

type VariantRow = { id: string; mof_category_id: string; name: string; position: number; created_at: string };

type LiteratureRow = {
  id: string; title: string; authors: string | null; journal: string | null;
  year: number | null; subject: string | null;
  doi: string | null; url: string | null;
  summary: string | null; helios_notes: string | null;
  added_by: string | null; created_at: string;
};

type TrainingRow = {
  id: string; title: string;
  category: string | null; level: string | null;
  url: string | null;
  purpose: string | null; steps: string | null; safety_notes: string | null;
  added_by: string | null; created_at: string;
};

// ── Mappers ──────────────────────────────────────────────────────────────────

const toNum = (v: number | string | null): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const toCategory = (r: CategoryRow): MofCategory => ({
  id: r.id, name: r.name, position: r.position, createdAt: r.created_at,
});

const toExperiment = (r: ExperimentRow): Experiment => ({
  id:                  r.id,
  mofCategoryId:       r.mof_category_id,
  shapingVariantId:    r.shaping_variant_id,
  parentId:            r.parent_id,
  subType:             (r.sub_type as SubExperimentType | null),
  title:               r.title,
  batchNo:             r.batch_no,
  referenceUrl:        r.reference_url,
  authorId:            dbToLegacyId(r.author_id ?? '') ?? null,
  experimentDate:      r.experiment_date,
  yieldPct:            toNum(r.yield_pct),
  amount:              r.amount,
  repeatReason:        r.repeat_reason,
  scaleUpDetail:       r.scale_up_detail,
  parameterDetail:     r.parameter_detail,
  generalOverview:     r.general_overview,
  reasonDiff:          r.reason_diff,
  procedureEquipment:  r.procedure_equipment,
  planResults:         r.plan_results,
  createdAt:           r.created_at,
});

const toMaterial = (r: MaterialRow): ExperimentMaterial => ({
  id: r.id, experimentId: r.experiment_id, name: r.name, amount: r.amount,
  position: r.position, createdAt: r.created_at,
});

const toCharacterization = (r: CharacterizationRow): ExperimentCharacterization => ({
  id:            r.id,
  experimentId:  r.experiment_id,
  type:          r.type,
  value:         r.value,
  notes:         r.notes,
  attachmentUrl: r.attachment_url,
  imageUrl:      r.image_url,
  performedAt:   r.performed_at,
  performedById: dbToLegacyId(r.performed_by_id ?? '') ?? null,
  position:      r.position,
  createdAt:     r.created_at,
});

const toVariant = (r: VariantRow): ShapingVariant => ({
  id: r.id, mofCategoryId: r.mof_category_id, name: r.name,
  position: r.position, createdAt: r.created_at,
});

const toLiterature = (r: LiteratureRow): LiteratureItem => ({
  id: r.id, title: r.title, authors: r.authors, journal: r.journal,
  year: r.year, subject: r.subject,
  doi: r.doi, url: r.url,
  summary: r.summary, heliosNotes: r.helios_notes,
  addedBy: dbToLegacyId(r.added_by ?? '') ?? null, createdAt: r.created_at,
});

const toTraining = (r: TrainingRow): Training => ({
  id: r.id, title: r.title,
  category: r.category, level: r.level,
  url: r.url,
  purpose: r.purpose, steps: r.steps, safetyNotes: r.safety_notes,
  addedBy: dbToLegacyId(r.added_by ?? '') ?? null,
  createdAt: r.created_at,
});

// ── Experiment SELECT cümlesi ────────────────────────────────────────────────

const EXP_SELECT = `
  id, mof_category_id, shaping_variant_id, parent_id, sub_type, title, batch_no, reference_url,
  author_id, experiment_date, yield_pct, amount,
  repeat_reason, scale_up_detail, parameter_detail,
  general_overview, reason_diff, procedure_equipment, plan_results,
  created_at
`.replace(/\s+/g, ' ').trim();

// ─────────────────────────────────────────────────────────────────────────────
// useMofData — MOF kategorileri + deneyler + malzemeler + karakterizasyonlar
//              + şekillendirme varyantları/kayıtları
// ─────────────────────────────────────────────────────────────────────────────

export function useMofData() {
  const [categories, setCategories]           = useState<MofCategory[]>([]);
  const [experiments, setExperiments]         = useState<Experiment[]>([]);
  const [materials, setMaterials]             = useState<ExperimentMaterial[]>([]);
  const [characterizations, setCharacterizations] = useState<ExperimentCharacterization[]>([]);
  const [variants, setVariants]               = useState<ShapingVariant[]>([]);
  const [loading, setLoading]                 = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [catRes, expRes, matRes, charRes, varRes] = await Promise.all([
      supabase.from('lab_book_mof_categories').select('id, name, position, created_at').order('position'),
      supabase.from('lab_book_experiments').select(EXP_SELECT).order('experiment_date', { ascending: false }),
      supabase.from('lab_book_experiment_materials').select('id, experiment_id, name, amount, position, created_at').order('position'),
      supabase.from('lab_book_experiment_characterizations').select('id, experiment_id, type, value, notes, attachment_url, image_url, performed_at, performed_by_id, position, created_at').order('position'),
      supabase.from('lab_book_shaping_variants').select('id, mof_category_id, name, position, created_at').order('position'),
    ]);
    if (catRes.error)  toast.error('MOF kategorileri yüklenemedi: ' + catRes.error.message);
    else setCategories(((catRes.data ?? []) as CategoryRow[]).map(toCategory));
    if (expRes.error)  toast.error('Deneyler yüklenemedi: ' + expRes.error.message);
    else setExperiments(((expRes.data ?? []) as unknown as ExperimentRow[]).map(toExperiment));
    if (matRes.error)  toast.error('Malzemeler yüklenemedi: ' + matRes.error.message);
    else setMaterials(((matRes.data ?? []) as MaterialRow[]).map(toMaterial));
    if (charRes.error) toast.error('Karakterizasyonlar yüklenemedi: ' + charRes.error.message);
    else setCharacterizations(((charRes.data ?? []) as CharacterizationRow[]).map(toCharacterization));
    if (varRes.error)  toast.error('Şekillendirme varyantları yüklenemedi: ' + varRes.error.message);
    else setVariants(((varRes.data ?? []) as VariantRow[]).map(toVariant));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Kategoriler ─────────────────────────────────────────────────────────────

  const addCategory = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const position = categories.length > 0 ? Math.max(...categories.map((c) => c.position)) + 1 : 0;
    const { data, error } = await supabase.from('lab_book_mof_categories')
      .insert({ name: trimmed, position })
      .select('id, name, position, created_at').single();
    if (error) { toast.error('MOF eklenemedi: ' + error.message); return; }
    setCategories((p) => [...p, toCategory(data as CategoryRow)]);
  }, [categories]);

  const renameCategory = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories((p) => p.map((c) => (c.id === id ? { ...c, name: trimmed } : c)));
    const { error } = await supabase.from('lab_book_mof_categories').update({ name: trimmed }).eq('id', id);
    if (error) { toast.error('Yeniden adlandırılamadı: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  const deleteCategory = useCallback(async (id: string) => {
    setCategories((p) => p.filter((c) => c.id !== id));
    setExperiments((p) => p.filter((e) => e.mofCategoryId !== id));
    setVariants((p) => p.filter((v) => v.mofCategoryId !== id));
    const { error } = await supabase.from('lab_book_mof_categories').delete().eq('id', id);
    if (error) { toast.error('Silinemedi: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  // ── Deneyler ────────────────────────────────────────────────────────────────

  type ExpAddPayload = {
    mofCategoryId:    string;
    shapingVariantId?: string | null;
    parentId?:        string | null;
    subType?:         SubExperimentType | null;
    title:            string;
    batchNo:          string;
    referenceUrl?:    string | null;
    authorLegacyId?:  string | null;
    experimentDate?:  string;
    yieldPct?:        number | null;
    amount?:          string | null;
    repeatReason?:    string | null;
    scaleUpDetail?:   string | null;
    parameterDetail?: string | null;
  };

  const addExperiment = useCallback(async (p: ExpAddPayload): Promise<Experiment | null> => {
    const authorDbId = p.authorLegacyId ? legacyToDbId(p.authorLegacyId) : null;
    const insert: Record<string, unknown> = {
      mof_category_id:    p.mofCategoryId,
      shaping_variant_id: p.shapingVariantId ?? null,
      parent_id:          p.parentId ?? null,
      sub_type:           p.subType ?? null,
      title:            p.title.trim(),
      batch_no:         p.batchNo.trim(),
      reference_url:    p.referenceUrl?.trim() || null,
      author_id:        authorDbId,
      experiment_date:  p.experimentDate || new Date().toISOString().slice(0, 10),
      yield_pct:        p.yieldPct ?? null,
      amount:           p.amount?.trim() || null,
      repeat_reason:    p.repeatReason?.trim() || null,
      scale_up_detail:  p.scaleUpDetail?.trim() || null,
      parameter_detail: p.parameterDetail?.trim() || null,
    };
    const { data, error } = await supabase.from('lab_book_experiments')
      .insert(insert).select(EXP_SELECT).single();
    if (error) { toast.error('Deney eklenemedi: ' + error.message); return null; }
    const created = toExperiment(data as unknown as ExperimentRow);
    setExperiments((prev) => [created, ...prev]);
    return created;
  }, []);

  type ExpUpdatePatch = Partial<{
    title:              string;
    batchNo:            string;
    referenceUrl:       string | null;
    authorLegacyId:     string | null;
    experimentDate:     string;
    yieldPct:           number | null;
    amount:             string | null;
    repeatReason:       string | null;
    scaleUpDetail:      string | null;
    parameterDetail:    string | null;
    generalOverview:    string | null;
    reasonDiff:         string | null;
    procedureEquipment: string | null;
    planResults:        string | null;
  }>;

  const updateExperiment = useCallback(async (id: string, patch: ExpUpdatePatch) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.title              !== undefined) dbPatch.title = patch.title;
    if (patch.batchNo            !== undefined) dbPatch.batch_no = patch.batchNo;
    if (patch.referenceUrl       !== undefined) dbPatch.reference_url = patch.referenceUrl;
    if (patch.authorLegacyId     !== undefined) dbPatch.author_id = patch.authorLegacyId ? legacyToDbId(patch.authorLegacyId) : null;
    if (patch.experimentDate     !== undefined) dbPatch.experiment_date = patch.experimentDate;
    if (patch.yieldPct           !== undefined) dbPatch.yield_pct = patch.yieldPct;
    if (patch.amount             !== undefined) dbPatch.amount = patch.amount;
    if (patch.repeatReason       !== undefined) dbPatch.repeat_reason = patch.repeatReason;
    if (patch.scaleUpDetail      !== undefined) dbPatch.scale_up_detail = patch.scaleUpDetail;
    if (patch.parameterDetail    !== undefined) dbPatch.parameter_detail = patch.parameterDetail;
    if (patch.generalOverview    !== undefined) dbPatch.general_overview = patch.generalOverview;
    if (patch.reasonDiff         !== undefined) dbPatch.reason_diff = patch.reasonDiff;
    if (patch.procedureEquipment !== undefined) dbPatch.procedure_equipment = patch.procedureEquipment;
    if (patch.planResults        !== undefined) dbPatch.plan_results = patch.planResults;

    // Optimistic local update
    setExperiments((prev) => prev.map((e) => {
      if (e.id !== id) return e;
      return {
        ...e,
        ...(patch.title              !== undefined ? { title: patch.title } : {}),
        ...(patch.batchNo            !== undefined ? { batchNo: patch.batchNo } : {}),
        ...(patch.referenceUrl       !== undefined ? { referenceUrl: patch.referenceUrl } : {}),
        ...(patch.authorLegacyId     !== undefined ? { authorId: patch.authorLegacyId } : {}),
        ...(patch.experimentDate     !== undefined ? { experimentDate: patch.experimentDate } : {}),
        ...(patch.yieldPct           !== undefined ? { yieldPct: patch.yieldPct } : {}),
        ...(patch.amount             !== undefined ? { amount: patch.amount } : {}),
        ...(patch.repeatReason       !== undefined ? { repeatReason: patch.repeatReason } : {}),
        ...(patch.scaleUpDetail      !== undefined ? { scaleUpDetail: patch.scaleUpDetail } : {}),
        ...(patch.parameterDetail    !== undefined ? { parameterDetail: patch.parameterDetail } : {}),
        ...(patch.generalOverview    !== undefined ? { generalOverview: patch.generalOverview } : {}),
        ...(patch.reasonDiff         !== undefined ? { reasonDiff: patch.reasonDiff } : {}),
        ...(patch.procedureEquipment !== undefined ? { procedureEquipment: patch.procedureEquipment } : {}),
        ...(patch.planResults        !== undefined ? { planResults: patch.planResults } : {}),
      };
    }));

    const { error } = await supabase.from('lab_book_experiments').update(dbPatch).eq('id', id);
    if (error) { toast.error('Güncellenemedi: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  const deleteExperiment = useCallback(async (id: string) => {
    // CASCADE: alt deneyler + materials + characterizations otomatik siliniyor
    setExperiments((p) => p.filter((e) => e.id !== id && !isDescendantOf(e.id, id, p)));
    setMaterials((p) => p.filter((m) => m.experimentId !== id));
    setCharacterizations((p) => p.filter((c) => c.experimentId !== id));
    const { error } = await supabase.from('lab_book_experiments').delete().eq('id', id);
    if (error) { toast.error('Silinemedi: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  // ── Malzemeler ─────────────────────────────────────────────────────────────

  const addMaterial = useCallback(async (experimentId: string, name: string, amount: string | null) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const expMats = materials.filter((m) => m.experimentId === experimentId);
    const position = expMats.length > 0 ? Math.max(...expMats.map((m) => m.position)) + 1 : 0;
    const { data, error } = await supabase.from('lab_book_experiment_materials').insert({
      experiment_id: experimentId, name: trimmed, amount: amount?.trim() || null, position,
    }).select('id, experiment_id, name, amount, position, created_at').single();
    if (error) { toast.error('Malzeme eklenemedi: ' + error.message); return null; }
    const created = toMaterial(data as MaterialRow);
    setMaterials((p) => [...p, created]);
    return created;
  }, [materials]);

  const updateMaterial = useCallback(async (id: string, patch: Partial<{ name: string; amount: string | null }>) => {
    setMaterials((p) => p.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    const { error } = await supabase.from('lab_book_experiment_materials').update(patch).eq('id', id);
    if (error) { toast.error('Güncellenemedi: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  const deleteMaterial = useCallback(async (id: string) => {
    setMaterials((p) => p.filter((m) => m.id !== id));
    const { error } = await supabase.from('lab_book_experiment_materials').delete().eq('id', id);
    if (error) { toast.error('Silinemedi: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  // ── Karakterizasyonlar ─────────────────────────────────────────────────────

  type CharAddPayload = {
    experimentId:      string;
    type:              string;
    value?:            string | null;
    notes?:            string | null;
    attachmentUrl?:    string | null;
    imageUrl?:         string | null;
    performedAt?:      string | null;
    performedByLegacyId?: string | null;
  };

  const addCharacterization = useCallback(async (p: CharAddPayload) => {
    const performedById = p.performedByLegacyId ? legacyToDbId(p.performedByLegacyId) : null;
    const expChars = characterizations.filter((c) => c.experimentId === p.experimentId);
    const position = expChars.length > 0 ? Math.max(...expChars.map((c) => c.position)) + 1 : 0;
    const { data, error } = await supabase.from('lab_book_experiment_characterizations').insert({
      experiment_id:   p.experimentId,
      type:            p.type.trim(),
      value:           p.value?.trim() || null,
      notes:           p.notes?.trim() || null,
      attachment_url:  p.attachmentUrl?.trim() || null,
      image_url:       p.imageUrl?.trim() || null,
      performed_at:    p.performedAt || null,
      performed_by_id: performedById,
      position,
    }).select('id, experiment_id, type, value, notes, attachment_url, image_url, performed_at, performed_by_id, position, created_at').single();
    if (error) { toast.error('Analiz eklenemedi: ' + error.message); return null; }
    const created = toCharacterization(data as CharacterizationRow);
    setCharacterizations((p2) => [...p2, created]);
    return created;
  }, [characterizations]);

  type CharUpdatePatch = Partial<{
    type:                  string;
    value:                 string | null;
    notes:                 string | null;
    attachmentUrl:         string | null;
    imageUrl:              string | null;
    performedAt:           string | null;
    performedByLegacyId:   string | null;
  }>;

  const updateCharacterization = useCallback(async (id: string, patch: CharUpdatePatch) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.type                !== undefined) dbPatch.type = patch.type;
    if (patch.value               !== undefined) dbPatch.value = patch.value;
    if (patch.notes               !== undefined) dbPatch.notes = patch.notes;
    if (patch.attachmentUrl       !== undefined) dbPatch.attachment_url = patch.attachmentUrl;
    if (patch.imageUrl            !== undefined) dbPatch.image_url = patch.imageUrl;
    if (patch.performedAt         !== undefined) dbPatch.performed_at = patch.performedAt;
    if (patch.performedByLegacyId !== undefined) dbPatch.performed_by_id = patch.performedByLegacyId ? legacyToDbId(patch.performedByLegacyId) : null;

    setCharacterizations((p) => p.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        ...(patch.type                !== undefined ? { type: patch.type } : {}),
        ...(patch.value               !== undefined ? { value: patch.value } : {}),
        ...(patch.notes               !== undefined ? { notes: patch.notes } : {}),
        ...(patch.attachmentUrl       !== undefined ? { attachmentUrl: patch.attachmentUrl } : {}),
        ...(patch.imageUrl            !== undefined ? { imageUrl: patch.imageUrl } : {}),
        ...(patch.performedAt         !== undefined ? { performedAt: patch.performedAt } : {}),
        ...(patch.performedByLegacyId !== undefined ? { performedById: patch.performedByLegacyId } : {}),
      };
    }));
    const { error } = await supabase.from('lab_book_experiment_characterizations').update(dbPatch).eq('id', id);
    if (error) { toast.error('Güncellenemedi: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  const deleteCharacterization = useCallback(async (id: string) => {
    setCharacterizations((p) => p.filter((c) => c.id !== id));
    const { error } = await supabase.from('lab_book_experiment_characterizations').delete().eq('id', id);
    if (error) { toast.error('Silinemedi: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  // ── Şekillendirme Varyantları ──────────────────────────────────────────────

  const addShapingVariant = useCallback(async (mofCategoryId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const catVariants = variants.filter((v) => v.mofCategoryId === mofCategoryId);
    const position = catVariants.length > 0 ? Math.max(...catVariants.map((v) => v.position)) + 1 : 0;
    const { data, error } = await supabase.from('lab_book_shaping_variants')
      .insert({ mof_category_id: mofCategoryId, name: trimmed, position })
      .select('id, mof_category_id, name, position, created_at').single();
    if (error) { toast.error('Varyant eklenemedi: ' + error.message); return; }
    setVariants((p) => [...p, toVariant(data as VariantRow)]);
  }, [variants]);

  const renameShapingVariant = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setVariants((p) => p.map((v) => (v.id === id ? { ...v, name: trimmed } : v)));
    const { error } = await supabase.from('lab_book_shaping_variants').update({ name: trimmed }).eq('id', id);
    if (error) { toast.error('Yeniden adlandırılamadı: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  const deleteShapingVariant = useCallback(async (id: string) => {
    setVariants((p) => p.filter((v) => v.id !== id));
    // İlgili variant'ı kullanan deneyleri local state'den temizle (CASCADE ile DB'de de silinir)
    setExperiments((p) => p.filter((e) => e.shapingVariantId !== id));
    const { error } = await supabase.from('lab_book_shaping_variants').delete().eq('id', id);
    if (error) { toast.error('Silinemedi: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  return {
    categories, experiments, materials, characterizations, variants, loading,
    addCategory, renameCategory, deleteCategory,
    addExperiment, updateExperiment, deleteExperiment,
    addMaterial, updateMaterial, deleteMaterial,
    addCharacterization, updateCharacterization, deleteCharacterization,
    addShapingVariant, renameShapingVariant, deleteShapingVariant,
  };
}

// Helper: bir deneyin başka bir deneyin alt-soyu (descendant) olup olmadığını kontrol et
function isDescendantOf(childId: string, ancestorId: string, all: Experiment[]): boolean {
  let current = all.find((e) => e.id === childId);
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = all.find((e) => e.id === current!.parentId);
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// useLabLiterature
// ─────────────────────────────────────────────────────────────────────────────

export function useLabLiterature() {
  const [items, setItems] = useState<LiteratureItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lab_book_literature')
      .select('id, title, authors, journal, year, subject, doi, url, summary, helios_notes, added_by, created_at')
      .order('created_at', { ascending: false });
    if (error) toast.error('Literatür yüklenemedi: ' + error.message);
    else setItems(((data ?? []) as LiteratureRow[]).map(toLiterature));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addLiterature = useCallback(async (payload: {
    title: string;
    authors?: string | null;
    journal?: string | null;
    year?: number | null;
    subject?: string | null;
    doi?: string | null;
    url?: string | null;
    summary?: string | null;
    heliosNotes?: string | null;
    addedByLegacyId?: string | null;
  }): Promise<LiteratureItem | null> => {
    const addedByDbId = payload.addedByLegacyId ? legacyToDbId(payload.addedByLegacyId) : null;
    const { data, error } = await supabase.from('lab_book_literature').insert({
      title: payload.title.trim(),
      authors: payload.authors?.trim() || null,
      journal: payload.journal?.trim() || null,
      year: payload.year ?? null,
      subject: payload.subject?.trim() || null,
      doi: payload.doi?.trim() || null,
      url: payload.url?.trim() || null,
      summary: payload.summary?.trim() || null,
      helios_notes: payload.heliosNotes?.trim() || null,
      added_by: addedByDbId,
    }).select('id, title, authors, journal, year, subject, doi, url, summary, helios_notes, added_by, created_at').single();
    if (error) { toast.error('Eklenemedi: ' + error.message); return null; }
    const created = toLiterature(data as LiteratureRow);
    setItems((p) => [created, ...p]);
    return created;
  }, []);

  const updateLiterature = useCallback(async (id: string, patch: Partial<{
    title: string;
    authors: string | null;
    journal: string | null;
    year: number | null;
    subject: string | null;
    doi: string | null;
    url: string | null;
    summary: string | null;
    heliosNotes: string | null;
  }>) => {
    // Frontend tip → DB kolon adı dönüşümü
    const dbPatch: Record<string, unknown> = {};
    if (patch.title       !== undefined) dbPatch.title = patch.title;
    if (patch.authors     !== undefined) dbPatch.authors = patch.authors;
    if (patch.journal     !== undefined) dbPatch.journal = patch.journal;
    if (patch.year        !== undefined) dbPatch.year = patch.year;
    if (patch.subject     !== undefined) dbPatch.subject = patch.subject;
    if (patch.doi         !== undefined) dbPatch.doi = patch.doi;
    if (patch.url         !== undefined) dbPatch.url = patch.url;
    if (patch.summary     !== undefined) dbPatch.summary = patch.summary;
    if (patch.heliosNotes !== undefined) dbPatch.helios_notes = patch.heliosNotes;

    setItems((p) => p.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    const { error } = await supabase.from('lab_book_literature').update(dbPatch).eq('id', id);
    if (error) { toast.error('Güncellenemedi: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  const deleteLiterature = useCallback(async (id: string) => {
    setItems((p) => p.filter((i) => i.id !== id));
    const { error } = await supabase.from('lab_book_literature').delete().eq('id', id);
    if (error) { toast.error('Silinemedi: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  return { items, loading, addLiterature, updateLiterature, deleteLiterature };
}

// ─────────────────────────────────────────────────────────────────────────────
// useLabTrainings
// ─────────────────────────────────────────────────────────────────────────────

export function useLabTrainings() {
  const [items, setItems] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lab_book_trainings')
      .select('id, title, category, level, url, purpose, steps, safety_notes, added_by, created_at')
      .order('created_at', { ascending: false });
    if (error) toast.error('Eğitimler yüklenemedi: ' + error.message);
    else setItems(((data ?? []) as TrainingRow[]).map(toTraining));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addTraining = useCallback(async (payload: {
    title: string;
    category?: string | null;
    level?: string | null;
    url?: string | null;
    purpose?: string | null;
    steps?: string | null;
    safetyNotes?: string | null;
    addedByLegacyId?: string | null;
  }): Promise<Training | null> => {
    const addedByDbId = payload.addedByLegacyId ? legacyToDbId(payload.addedByLegacyId) : null;
    const { data, error } = await supabase.from('lab_book_trainings').insert({
      title: payload.title.trim(),
      category: payload.category?.trim() || null,
      level: payload.level?.trim() || null,
      url: payload.url?.trim() || null,
      purpose: payload.purpose?.trim() || null,
      steps: payload.steps?.trim() || null,
      safety_notes: payload.safetyNotes?.trim() || null,
      added_by: addedByDbId,
    }).select('id, title, category, level, url, purpose, steps, safety_notes, added_by, created_at').single();
    if (error) { toast.error('Eklenemedi: ' + error.message); return null; }
    const created = toTraining(data as TrainingRow);
    setItems((p) => [created, ...p]);
    return created;
  }, []);

  const updateTraining = useCallback(async (id: string, patch: Partial<{
    title: string;
    category: string | null;
    level: string | null;
    url: string | null;
    purpose: string | null;
    steps: string | null;
    safetyNotes: string | null;
  }>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.title       !== undefined) dbPatch.title = patch.title;
    if (patch.category    !== undefined) dbPatch.category = patch.category;
    if (patch.level       !== undefined) dbPatch.level = patch.level;
    if (patch.url         !== undefined) dbPatch.url = patch.url;
    if (patch.purpose     !== undefined) dbPatch.purpose = patch.purpose;
    if (patch.steps       !== undefined) dbPatch.steps = patch.steps;
    if (patch.safetyNotes !== undefined) dbPatch.safety_notes = patch.safetyNotes;

    setItems((p) => p.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    const { error } = await supabase.from('lab_book_trainings').update(dbPatch).eq('id', id);
    if (error) { toast.error('Güncellenemedi: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  const deleteTraining = useCallback(async (id: string) => {
    setItems((p) => p.filter((i) => i.id !== id));
    const { error } = await supabase.from('lab_book_trainings').delete().eq('id', id);
    if (error) { toast.error('Silinemedi: ' + error.message); fetchAll(); }
  }, [fetchAll]);

  return { items, loading, addTraining, updateTraining, deleteTraining };
}
