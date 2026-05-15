import React, { useEffect, useState } from 'react';
import {
  ChevronRight, ChevronDown, Plus, Pencil, Trash2, Check, X, FlaskConical, FileText,
} from 'lucide-react';
import { cn } from '../../../../../../lib/utils';
import { confirmAction } from '../../../../../../lib/confirm';
import { useLabBook } from '../../context';
import type { Experiment } from '../../types';
import { EmptyState } from '../EmptyState';
import { ExperimentTreeNode } from '../ExperimentTreeNode';
import { ExperimentDetailView } from '../ExperimentDetailView';
import { ExperimentSummaryView } from '../ExperimentSummaryView';
import { ExperimentModal } from '../modals/ExperimentModal';
import { exportCategoryPdf } from '../../pdfExport';
import { getCachedUsers } from '../../../../../../lib/users';

export const MofUretimiTab: React.FC = () => {
  const {
    user, search,
    mof: {
      categories, experiments: allExperiments, characterizations,
      addCategory, renameCategory, deleteCategory, deleteExperiment,
    },
    mofTabSelectedCategoryId, setMofTabSelectedCategoryId,
    mofTabSelectedExperimentId, setMofTabSelectedExperimentId,
  } = useLabBook();

  // MOF Üretimi tab'ında yalnızca sentez deneyleri (şekillendirme değil)
  const experiments = allExperiments.filter((e) => e.shapingVariantId === null);
  const selectedCategory = categories.find((c) => c.id === mofTabSelectedCategoryId) ?? null;

  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [expandedExps, setExpandedExps] = useState<Set<string>>(new Set());

  // Toplu seçim modu
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
  const [renamingCatId, setRenamingCatId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState('');
  const [experimentModal, setExperimentModal] = useState<{
    mode: 'add' | 'edit';
    mofCategoryId: string;
    parent?: Experiment | null;
    experiment?: Experiment;
  } | null>(null);

  // Seçili deneyi takip et — silindiğinde null'a düşür
  const selectedExperiment = mofTabSelectedExperimentId
    ? experiments.find((e) => e.id === mofTabSelectedExperimentId) ?? null
    : null;

  useEffect(() => {
    if (mofTabSelectedExperimentId && !selectedExperiment) {
      setMofTabSelectedExperimentId(null);
    }
  }, [mofTabSelectedExperimentId, selectedExperiment, setMofTabSelectedExperimentId]);

  // Search filtresi: deneyleri filtreleyip eşleşen üst-soyları otomatik aç
  const visibleExperimentIds = (() => {
    if (!search.trim()) return null;
    const q = search.trim().toLowerCase();
    const matches = experiments.filter((e) =>
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
        current = current.parentId ? experiments.find((p) => p.id === current!.parentId) : undefined;
      }
    });
    return ids;
  })();

  const toggleCatExpand = (id: string) => {
    setExpandedCats((p) => {
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

  const startRename = (id: string, name: string) => {
    setRenamingCatId(id); setRenameDraft(name);
  };

  const commitRename = () => {
    if (renamingCatId && renameDraft.trim()) renameCategory(renamingCatId, renameDraft.trim());
    setRenamingCatId(null); setRenameDraft('');
  };

  const commitAddCategory = () => {
    if (categoryDraft.trim()) addCategory(categoryDraft.trim());
    setCategoryDraft(''); setAddingCategory(false);
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const ok = await confirmAction({
      title: 'MOF kategorisini sil?',
      message: `"${name}" ve tüm deneyleri/şekillendirme/karakterizasyonları silinecek.`,
      confirmText: 'Sil', variant: 'danger',
    });
    if (ok) deleteCategory(id);
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
      if (mofTabSelectedExperimentId === exp.id) setMofTabSelectedExperimentId(parentId);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Sol sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-85 shrink-0 border-r border-[#cdc4ad] overflow-y-auto">
        <div className="px-5 py-5 flex items-center justify-between border-b border-[#cdc4ad]/70">
          <h2 className="helios-eln-title text-[22px] font-bold">MOF Üretimi</h2>
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
              onClick={() => setAddingCategory(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[1px] text-[#1F3D2E] border border-[#cdc4ad] rounded-md hover:bg-[#ece4cf]"
            >
              <Plus size={11} /> MOF
            </button>
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
                const selectedExps = experiments.filter((e) => selectedIds.has(e.id));
                const catName = selectedCategory?.name ?? 'MOF Üretimi';
                exportCategoryPdf(
                  { id: 'selection', name: `${catName} — Seçili Deneyler`, position: 0, createdAt: new Date().toISOString() },
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

        {addingCategory && (
          <div className="px-4 py-2.5 flex items-center gap-1.5 border-b border-[#e6dfc8] bg-[#f5efe0]/40">
            <input
              autoFocus
              value={categoryDraft}
              onChange={(e) => setCategoryDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitAddCategory();
                if (e.key === 'Escape') { setCategoryDraft(''); setAddingCategory(false); }
              }}
              placeholder="Yeni MOF adı..."
              className="flex-1 px-2 py-1 text-[12.5px] bg-white border border-[#cdc4ad] rounded outline-none focus:border-[#1F3D2E]"
            />
            <button onClick={commitAddCategory} className="p-1 text-[#0F6E56] hover:bg-[#E1F5EE] rounded">
              <Check size={13} />
            </button>
            <button onClick={() => { setCategoryDraft(''); setAddingCategory(false); }} className="p-1 text-[#6f6749] hover:bg-[#ece4cf] rounded">
              <X size={13} />
            </button>
          </div>
        )}

        {/* Kategori listesi */}
        <div className="py-2">
          {categories.map((cat) => {
            const isExpanded = expandedCats.has(cat.id);
            const isSelected = mofTabSelectedCategoryId === cat.id;
            const topExps = experiments
              .filter((e) => e.mofCategoryId === cat.id && e.parentId === null);
            // [N] badge: normal modda tüm deneyler; select modda bu kategoriden seçili sayısı
            const allExps = experiments.filter((e) => e.mofCategoryId === cat.id);
            const selectedCountInCat = selectMode
              ? allExps.filter((e) => selectedIds.has(e.id)).length
              : 0;
            const displayCount = selectMode ? selectedCountInCat : allExps.length;
            const visibleTopExps = visibleExperimentIds
              ? topExps.filter((e) => visibleExperimentIds.has(e.id))
              : topExps;
            return (
              <div key={cat.id} className="group/cat">
                <div
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 cursor-pointer transition-colors',
                    isSelected ? 'bg-[#ece4cf]' : 'hover:bg-[#f5efe0]'
                  )}
                  onClick={() => { setMofTabSelectedCategoryId(cat.id); toggleCatExpand(cat.id); }}
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleCatExpand(cat.id); }}
                    className="text-[#6f6749] shrink-0"
                  >
                    {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                  {renamingCatId === cat.id ? (
                    <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename();
                          if (e.key === 'Escape') { setRenamingCatId(null); setRenameDraft(''); }
                        }}
                        className="flex-1 px-1.5 py-0.5 text-[13px] bg-white border border-[#cdc4ad] rounded outline-none focus:border-[#1F3D2E]"
                      />
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 helios-eln-title text-[15px] font-bold truncate">{cat.name}</span>
                      <span className="text-[11px] font-mono text-[#6f6749]">[{displayCount}]</span>
                      <div className="opacity-0 group-hover/cat:opacity-100 flex items-center gap-0.5 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setExperimentModal({ mode: 'add', mofCategoryId: cat.id })}
                          title="Deney ekle"
                          className="p-1 text-[#1F3D2E] hover:bg-white rounded"
                        >
                          <Plus size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => startRename(cat.id, cat.name)}
                          title="Yeniden adlandır"
                          className="p-1 text-[#6f6749] hover:bg-white rounded"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          title="Sil"
                          className="p-1 text-[#791F1F] hover:bg-white rounded"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </>
                  )}
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
                          allExperiments={experiments}
                          expanded={expandedExps}
                          toggleExpand={toggleExpExpand}
                          selectedId={mofTabSelectedExperimentId}
                          onSelect={(id) => setMofTabSelectedExperimentId(id)}
                          onAddChild={(parent) => setExperimentModal({ mode: 'add', mofCategoryId: cat.id, parent })}
                          onEdit={(e) => setExperimentModal({ mode: 'edit', mofCategoryId: cat.id, experiment: e })}
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
          })}

          {categories.length === 0 && !addingCategory && (
            <p className="px-5 py-6 text-[12.5px] italic text-[#6f6749] text-center">
              Henüz MOF kategorisi yok. + MOF ile ekle.
            </p>
          )}
        </div>
      </aside>

      {/* ── Sağ panel ───────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {selectedExperiment ? (
          <ExperimentDetailView
            experiment={selectedExperiment}
            onAddChild={(parent) => setExperimentModal({
              mode: 'add',
              mofCategoryId: parent.mofCategoryId,
              parent,
            })}
            onSelectParent={(id) => setMofTabSelectedExperimentId(id)}
          />
        ) : selectedCategory ? (
          <ExperimentSummaryView
            breadcrumb="MOF ÜRETIMI · KATEGORI ÖZETI"
            title={selectedCategory.name}
            experiments={experiments.filter((e) => e.mofCategoryId === selectedCategory.id)}
            characterizations={characterizations}
            onSelectExperiment={(id) => setMofTabSelectedExperimentId(id)}
            onNewExperiment={() => setExperimentModal({ mode: 'add', mofCategoryId: selectedCategory.id })}
            onEditExperiment={(exp) => setExperimentModal({ mode: 'edit', mofCategoryId: selectedCategory.id, experiment: exp })}
            onPdf={() => exportCategoryPdf(
              selectedCategory,
              experiments.filter((e) => e.mofCategoryId === selectedCategory.id),
              getCachedUsers().map((u) => ({ id: u.id, name: u.name })),
            )}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState
              icon={FlaskConical}
              title="MOF Üretimi"
              subtitle="Soldan bir MOF seç, ya da yeni bir kategori ekle."
            />
          </div>
        )}
      </main>

      {experimentModal && (
        <ExperimentModal
          mode={experimentModal.mode}
          mofCategoryId={experimentModal.mofCategoryId}
          parent={experimentModal.parent}
          experiment={experimentModal.experiment}
          currentUserId={user.id}
          onClose={() => setExperimentModal(null)}
          onCreated={(exp) => {
            // Yeni eklenen deneyi seç + parent'ı expand et
            setMofTabSelectedExperimentId(exp.id);
            if (exp.parentId) {
              setExpandedExps((p) => {
                const next = new Set(p);
                next.add(exp.parentId!);
                return next;
              });
            }
            setExpandedCats((p) => {
              const next = new Set(p);
              next.add(exp.mofCategoryId);
              return next;
            });
          }}
        />
      )}
    </div>
  );
};
