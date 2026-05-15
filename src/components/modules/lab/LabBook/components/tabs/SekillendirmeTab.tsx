import React, { useEffect, useState } from 'react';
import {
  ChevronRight, ChevronDown, Plus, Pencil, Trash2, Layers, Check, X, FileText,
} from 'lucide-react';
import { cn } from '../../../../../../lib/utils';
import { confirmAction } from '../../../../../../lib/confirm';
import { useLabBook } from '../../context';
import type { Experiment, ShapingVariant } from '../../types';
import { EmptyState } from '../EmptyState';
import { ExperimentTreeNode } from '../ExperimentTreeNode';
import { ExperimentDetailView } from '../ExperimentDetailView';
import { ExperimentSummaryView } from '../ExperimentSummaryView';
import { ExperimentModal } from '../modals/ExperimentModal';
import { ShapingVariantModal } from '../modals/ShapingVariantModal';
import { exportCategoryPdf } from '../../pdfExport';
import { getCachedUsers } from '../../../../../../lib/users';

export const SekillendirmeTab: React.FC = () => {
  const {
    user, search,
    mof: {
      categories, experiments, variants, characterizations,
      addCategory, deleteShapingVariant, deleteExperiment,
    },
    shapingSelectedMofId, setShapingSelectedMofId,
    shapingSelectedExperimentId, setShapingSelectedExperimentId,
  } = useLabBook();

  // Variant seçimi (özet görünümü için)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());

  // Toplu seçim modu (SEÇ butonu)
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };
  const [expandedExps,     setExpandedExps]     = useState<Set<string>>(new Set());
  const [variantModal, setVariantModal] = useState<{ mode: 'add' | 'edit'; mofCategoryId: string; variant?: ShapingVariant } | null>(null);
  const [experimentModal, setExperimentModal] = useState<{
    mode: 'add' | 'edit';
    mofCategoryId: string;
    shapingVariantId?: string | null;
    parent?: Experiment | null;
    experiment?: Experiment;
  } | null>(null);
  const [addingMof, setAddingMof] = useState(false);
  const [mofDraft, setMofDraft] = useState('');

  const selectedMof = categories.find((c) => c.id === shapingSelectedMofId) ?? null;

  // Sadece şekillendirme deneyleri (shaping_variant_id IS NOT NULL)
  const shapingExperiments = experiments.filter((e) => e.shapingVariantId !== null);

  const selectedExperiment = shapingSelectedExperimentId
    ? shapingExperiments.find((e) => e.id === shapingSelectedExperimentId) ?? null
    : null;

  useEffect(() => {
    if (shapingSelectedExperimentId && !selectedExperiment) {
      setShapingSelectedExperimentId(null);
    }
  }, [shapingSelectedExperimentId, selectedExperiment, setShapingSelectedExperimentId]);

  const mofVariants = selectedMof ? variants.filter((v) => v.mofCategoryId === selectedMof.id) : [];

  // Search filtresi: eşleşen deneylerin atalarını otomatik aç
  const visibleExperimentIds = (() => {
    if (!search.trim()) return null;
    const q = search.trim().toLowerCase();
    const matches = shapingExperiments.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      e.batchNo.toLowerCase().includes(q) ||
      (e.generalOverview ?? '').toLowerCase().includes(q) ||
      (e.reasonDiff ?? '').toLowerCase().includes(q) ||
      (e.procedureEquipment ?? '').toLowerCase().includes(q) ||
      (e.planResults ?? '').toLowerCase().includes(q)
    );
    const ids = new Set<string>();
    matches.forEach((e) => {
      let current: Experiment | undefined = e;
      while (current) {
        ids.add(current.id);
        current = current.parentId ? shapingExperiments.find((p) => p.id === current!.parentId) : undefined;
      }
    });
    return ids;
  })();

  const toggleVariantExpand = (id: string) => {
    setExpandedVariants((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleExpExpand = (id: string) => {
    setExpandedExps((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const commitAddMof = () => {
    if (mofDraft.trim()) addCategory(mofDraft.trim());
    setMofDraft(''); setAddingMof(false);
  };

  const handleDeleteVariant = async (v: ShapingVariant) => {
    const ok = await confirmAction({
      title: 'Varyantı sil?',
      message: `"${v.name}" varyantı ve altındaki tüm deneyler silinecek.`,
      confirmText: 'Sil', variant: 'danger',
    });
    if (ok) deleteShapingVariant(v.id);
  };

  const handleDeleteExperiment = async (exp: Experiment) => {
    const ok = await confirmAction({
      title: 'Deneyi sil?',
      message: `"${exp.title}" ve tüm alt deneyleri silinecek.`,
      confirmText: 'Sil', variant: 'danger',
    });
    if (ok) {
      const parentId = exp.parentId;
      await deleteExperiment(exp.id);
      if (shapingSelectedExperimentId === exp.id) setShapingSelectedExperimentId(parentId);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Sol sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-85 shrink-0 border-r border-[#cdc4ad] overflow-y-auto">
        <div className="px-5 py-5 flex items-center justify-between border-b border-[#cdc4ad]/70">
          <h2 className="helios-eln-title text-[22px] font-bold">Şekillendirme</h2>
          <div className="flex items-center gap-1">
            {selectMode ? (
              <button
                type="button"
                onClick={exitSelectMode}
                className="flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[1px] text-white bg-[#BA7517] border border-[#BA7517] rounded-md hover:bg-[#a86713]"
              >
                <X size={11} /> Çık
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectMode(true)}
                className="px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[1px] text-[#1F3D2E] border border-[#cdc4ad] rounded-md hover:bg-[#ece4cf]"
              >
                Seç
              </button>
            )}
            <button
              type="button"
              onClick={() => setAddingMof(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[1px] text-[#1F3D2E] border border-[#cdc4ad] rounded-md hover:bg-[#ece4cf]"
            >
              <Plus size={11} /> MOF
            </button>
          </div>
        </div>

        {addingMof && (
          <div className="px-4 py-2.5 flex items-center gap-1.5 border-b border-[#e6dfc8] bg-[#f5efe0]/40">
            <input
              autoFocus
              value={mofDraft}
              onChange={(e) => setMofDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitAddMof();
                if (e.key === 'Escape') { setMofDraft(''); setAddingMof(false); }
              }}
              placeholder="Yeni MOF adı..."
              className="flex-1 px-2 py-1 text-[12.5px] bg-white border border-[#cdc4ad] rounded outline-none focus:border-[#1F3D2E]"
            />
            <button onClick={commitAddMof} className="p-1 text-[#0F6E56] hover:bg-[#E1F5EE] rounded">
              <Check size={13} />
            </button>
            <button onClick={() => { setMofDraft(''); setAddingMof(false); }} className="p-1 text-[#6f6749] hover:bg-[#ece4cf] rounded">
              <X size={13} />
            </button>
          </div>
        )}

        {/* MOF chip seçici */}
        <div className="px-4 py-3 border-b border-[#cdc4ad]/70">
          <p className="text-[10px] font-semibold tracking-[1.5px] uppercase text-[#6f6749] mb-2">MOF Seç</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => {
              const isActive = shapingSelectedMofId === c.id;
              // Normal modda: toplam deney sayısı; select modda: bu MOF'tan seçili sayısı
              const mofShapingCount = shapingExperiments.filter((e) => e.mofCategoryId === c.id).length;
              const mofSelectedCount = selectMode
                ? shapingExperiments.filter((e) => e.mofCategoryId === c.id && selectedIds.has(e.id)).length
                : 0;
              const displayCount = selectMode ? mofSelectedCount : mofShapingCount;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setShapingSelectedMofId(c.id);
                    setShapingSelectedExperimentId(null);
                    setSelectedVariantId(null);
                  }}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 text-[11.5px] font-semibold rounded-md border transition-colors',
                    isActive
                      ? 'bg-[#BA7517] border-[#BA7517] text-white'
                      : 'bg-white border-[#cdc4ad] text-[#5a5240] hover:bg-[#ece4cf]'
                  )}
                >
                  {c.name}
                  {displayCount > 0 && (
                    <span className={cn(
                      'text-[10px] font-mono px-1.5 rounded-full',
                      isActive ? 'bg-white/25 text-white' : 'bg-[#ece4cf] text-[#6f6749]'
                    )}>
                      {displayCount}
                    </span>
                  )}
                </button>
              );
            })}
            {categories.length === 0 && <span className="text-[11.5px] italic text-[#6f6749]">MOF yok</span>}
          </div>
        </div>

        {/* Toplu seçim sayım barı */}
        {selectMode && (
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#cdc4ad]/70 bg-[#f5efe0]">
            <span className="text-[12px] font-semibold text-[#1F3D2E]">
              {selectedIds.size} seçili
            </span>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => {
                const selectedExps = shapingExperiments.filter((e) => selectedIds.has(e.id));
                const mofName = selectedMof?.name ?? 'Şekillendirme';
                exportCategoryPdf(
                  { id: 'selection', name: `${mofName} — Seçili Deneyler`, position: 0, createdAt: new Date().toISOString() },
                  selectedExps,
                  getCachedUsers().map((u) => ({ id: u.id, name: u.name })),
                );
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-[#1F3D2E] bg-white border border-[#cdc4ad] rounded-md hover:bg-[#ece4cf] disabled:opacity-40"
            >
              <FileText size={12} /> PDF
            </button>
          </div>
        )}

        {/* Seçili MOF'un varyantları */}
        {selectedMof && (
          <div className="py-2">
            <div className="px-5 pt-3 pb-2 border-b border-[#cdc4ad]/40">
              <h3 className="helios-eln-title text-[16px] font-bold">{selectedMof.name}</h3>
              <p className="text-[9.5px] font-semibold tracking-[1.5px] uppercase text-[#6f6749] mt-0.5">
                Şekillendirme Varyantları
              </p>
            </div>

            {mofVariants.length === 0 ? (
              <p className="px-5 py-4 text-[12px] italic text-[#6f6749]">Henüz varyant yok</p>
            ) : (
              mofVariants.map((v) => {
                const isExpanded = expandedVariants.has(v.id);
                const topExps = shapingExperiments.filter((e) => e.shapingVariantId === v.id && e.parentId === null);
                // [N] badge: tüm deneyler (top + sub) — kullanıcı toplam görmek istiyor
                const allExps = shapingExperiments.filter((e) => e.shapingVariantId === v.id);
                const visibleTopExps = visibleExperimentIds
                  ? topExps.filter((e) => visibleExperimentIds.has(e.id))
                  : topExps;
                return (
                  <div key={v.id} className="group/var">
                    <div
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2 cursor-pointer transition-colors',
                        selectedVariantId === v.id && !shapingSelectedExperimentId
                          ? 'bg-[#ece4cf]'
                          : 'hover:bg-[#f5efe0]'
                      )}
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setShapingSelectedExperimentId(null);
                        toggleVariantExpand(v.id);
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleVariantExpand(v.id); }}
                        className="text-[#6f6749] shrink-0"
                      >
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>
                      <Layers size={12} className="text-[#6f6749] shrink-0" />
                      <span className="flex-1 text-[13px] font-semibold truncate">{v.name}</span>
                      <span className="text-[11px] font-mono text-[#6f6749]">[{allExps.length}]</span>
                      <div className="opacity-0 group-hover/var:opacity-100 flex items-center gap-0.5 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setExperimentModal({
                            mode: 'add',
                            mofCategoryId: selectedMof.id,
                            shapingVariantId: v.id,
                          })}
                          title="Deney ekle"
                          className="p-1 text-[#1F3D2E] hover:bg-white rounded"
                        >
                          <Plus size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setVariantModal({ mode: 'edit', mofCategoryId: selectedMof.id, variant: v })}
                          title="Düzenle"
                          className="p-1 text-[#6f6749] hover:bg-white rounded"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVariant(v)}
                          title="Sil"
                          className="p-1 text-[#791F1F] hover:bg-white rounded"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pb-1.5">
                        {visibleTopExps.length === 0 ? (
                          <p className="px-7 py-1.5 text-[11px] italic text-[#6f6749]">
                            {search.trim() ? 'Eşleşme yok' : 'Deney yok'}
                          </p>
                        ) : (
                          visibleTopExps.map((exp) => (
                            <ExperimentTreeNode
                              key={exp.id}
                              experiment={exp}
                              depth={1}
                              allExperiments={shapingExperiments}
                              expanded={expandedExps}
                              toggleExpand={toggleExpExpand}
                              selectedId={shapingSelectedExperimentId}
                              onSelect={(id) => setShapingSelectedExperimentId(id)}
                              onAddChild={(parent) => setExperimentModal({
                                mode: 'add',
                                mofCategoryId: selectedMof.id,
                                shapingVariantId: v.id,
                                parent,
                              })}
                              onEdit={(e) => setExperimentModal({
                                mode: 'edit',
                                mofCategoryId: selectedMof.id,
                                shapingVariantId: v.id,
                                experiment: e,
                              })}
                              onDelete={handleDeleteExperiment}
                              selectMode={selectMode}
                              selectedIds={selectedIds}
                              onToggleSelect={toggleSelect}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <button
              type="button"
              onClick={() => setVariantModal({ mode: 'add', mofCategoryId: selectedMof.id })}
              className="mx-4 my-2 flex items-center justify-center gap-1.5 w-[calc(100%-2rem)] py-2 text-[11px] font-semibold uppercase tracking-[1px] text-[#1F3D2E] border-2 border-dashed border-[#cdc4ad] rounded-lg hover:bg-[#ece4cf]"
            >
              <Plus size={12} /> Yeni Şekil
            </button>
          </div>
        )}
      </aside>

      {/* ── Sağ panel ───────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {selectedExperiment ? (
          <ExperimentDetailView
            experiment={selectedExperiment}
            onAddChild={(parent) => setExperimentModal({
              mode: 'add',
              mofCategoryId: parent.mofCategoryId,
              shapingVariantId: parent.shapingVariantId,
              parent,
            })}
            onSelectParent={(id) => setShapingSelectedExperimentId(id)}
          />
        ) : (selectedVariantId && selectedMof) ? (() => {
          const variant = variants.find((v) => v.id === selectedVariantId);
          if (!variant) return null;
          const variantExps = shapingExperiments.filter((e) => e.shapingVariantId === variant.id);
          return (
            <ExperimentSummaryView
              breadcrumb={`ŞEKILLENDIRME · ${selectedMof.name.toUpperCase()} · KATEGORI ÖZETI`}
              title={variant.name}
              experiments={variantExps}
              characterizations={characterizations}
              onSelectExperiment={(id) => setShapingSelectedExperimentId(id)}
              onNewExperiment={() => setExperimentModal({
                mode: 'add',
                mofCategoryId: selectedMof.id,
                shapingVariantId: variant.id,
              })}
              onEditExperiment={(exp) => setExperimentModal({
                mode: 'edit',
                mofCategoryId: selectedMof.id,
                shapingVariantId: variant.id,
                experiment: exp,
              })}
              onPdf={() => exportCategoryPdf(
                { id: variant.id, name: `${selectedMof.name} — ${variant.name}`, position: 0, createdAt: variant.createdAt },
                variantExps,
                getCachedUsers().map((u) => ({ id: u.id, name: u.name })),
              )}
            />
          );
        })() : (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState
              icon={Layers}
              title="Şekillendirme"
              subtitle="Soldan bir MOF + varyant seç, ya da yeni bir kayıt ekle."
            />
          </div>
        )}
      </main>

      {variantModal && (
        <ShapingVariantModal
          mode={variantModal.mode}
          mofCategoryId={variantModal.mofCategoryId}
          variant={variantModal.variant}
          onClose={() => setVariantModal(null)}
        />
      )}
      {experimentModal && (
        <ExperimentModal
          mode={experimentModal.mode}
          mofCategoryId={experimentModal.mofCategoryId}
          shapingVariantId={experimentModal.shapingVariantId}
          parent={experimentModal.parent}
          experiment={experimentModal.experiment}
          currentUserId={user.id}
          onClose={() => setExperimentModal(null)}
          onCreated={(exp) => {
            setShapingSelectedExperimentId(exp.id);
            if (exp.parentId) {
              setExpandedExps((p) => { const next = new Set(p); next.add(exp.parentId!); return next; });
            }
            if (exp.shapingVariantId) {
              setExpandedVariants((p) => { const next = new Set(p); next.add(exp.shapingVariantId!); return next; });
            }
          }}
        />
      )}
    </div>
  );
};
