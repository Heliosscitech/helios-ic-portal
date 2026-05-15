import React, { useMemo, useState } from 'react';
import {
  FileText, Plus, FlaskConical, ArrowUpDown, ArrowUp, ArrowDown,
  Pencil, Trash2, RotateCw, Scale, SlidersHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { confirmAction } from '../../../../../lib/confirm';
import { getCachedUsers } from '../../../../../lib/users';
import { useLabBook } from '../context';
import { SUB_TYPE_LABEL, formatDateShort } from '../types';
import type { Experiment, ExperimentCharacterization, SubExperimentType } from '../types';

type SortKey = 'title' | 'bet' | 'sem' | 'yieldPct' | 'amount' | null;
type SortDir = 'asc' | 'desc';

const SUB_ICONS: Record<SubExperimentType, LucideIcon> = {
  repeat:    RotateCw,
  scale_up:  Scale,
  parameter: SlidersHorizontal,
};

interface Props {
  breadcrumb:        string;            // "MOF ÜRETIMI · KATEGORI ÖZETI"
  title:             string;            // "CALF-20" veya "Pellet"
  experiments:       Experiment[];      // bu kategori/varyanttaki tüm deneyler
  characterizations: ExperimentCharacterization[];
  onSelectExperiment: (id: string) => void;
  onNewExperiment:    () => void;
  onPdf:              () => void;
  onEditExperiment?:  (exp: Experiment) => void;
}

export const ExperimentSummaryView: React.FC<Props> = ({
  breadcrumb, title, experiments, characterizations,
  onSelectExperiment, onNewExperiment, onPdf, onEditExperiment,
}) => {
  const { mof: { deleteExperiment } } = useLabBook();
  const portalUsers = getCachedUsers();
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Karakterizasyon yardımcısı: deney için belirli türden ilk değer
  const getCharValue = (expId: string, type: 'BET' | 'SEM'): string | null => {
    const c = characterizations.find((x) => x.experimentId === expId && x.type === type);
    return c?.value ?? null;
  };

  // Sıralama
  const sorted = useMemo(() => {
    if (!sortKey) return experiments;
    return [...experiments].sort((a, b) => {
      let av: string | number | null = null;
      let bv: string | number | null = null;
      if (sortKey === 'title')         { av = a.title; bv = b.title; }
      else if (sortKey === 'yieldPct') { av = a.yieldPct; bv = b.yieldPct; }
      else if (sortKey === 'amount')   { av = a.amount; bv = b.amount; }
      else if (sortKey === 'bet')      { av = getCharValue(a.id, 'BET'); bv = getCharValue(b.id, 'BET'); }
      else if (sortKey === 'sem')      { av = getCharValue(a.id, 'SEM'); bv = getCharValue(b.id, 'SEM'); }
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [experiments, sortKey, sortDir, characterizations]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stats
  const stats = useMemo(() => {
    const expIds = new Set(experiments.map((e) => e.id));
    return {
      count: experiments.length,
      yields: experiments.filter((e) => e.yieldPct !== null).length,
      bets: characterizations.filter((c) => c.type === 'BET' && expIds.has(c.experimentId)).length,
    };
  }, [experiments, characterizations]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };
  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown size={11} className="opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
  };

  const authorName = (legacyId: string | null) =>
    legacyId ? portalUsers.find((u) => u.id === legacyId)?.name ?? legacyId : '—';

  const handleDelete = async (exp: Experiment) => {
    const ok = await confirmAction({
      title: 'Deneyi sil?',
      message: `"${exp.title}" ve tüm alt deneyleri silinecek.`,
      confirmText: 'Sil', variant: 'danger',
    });
    if (ok) deleteExperiment(exp.id);
  };

  return (
    <div className="px-8 py-6 space-y-5 overflow-y-auto h-full">
      {/* Breadcrumb */}
      <div className="text-[10.5px] font-semibold tracking-[1.5px] uppercase text-[#6f6749]">
        {breadcrumb}
      </div>

      {/* Başlık ve aksiyonlar */}
      <div className="flex items-start justify-between gap-4 border-b border-[#cdc4ad] pb-4">
        <div>
          <h1 className="helios-eln-title text-[40px] font-bold leading-tight">{title}</h1>
          <div className="mt-1.5 flex items-center gap-4 text-[12px] text-[#6f6749]">
            <span><span className="font-mono text-[#1F3D2E] font-semibold">{stats.count}</span> deney</span>
            <span>·</span>
            <span><span className="font-mono text-[#1F3D2E] font-semibold">{stats.yields}</span> verim kayıtlı</span>
            <span>·</span>
            <span><span className="font-mono text-[#1F3D2E] font-semibold">{stats.bets}</span> BET ölçümü</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPdf}
            className="flex items-center gap-2 px-3 py-2 text-[11.5px] font-semibold uppercase tracking-[1px] text-[#1F3D2E] border border-[#cdc4ad] rounded-lg hover:bg-[#ece4cf]"
          >
            <FileText size={13} /> Hepsini PDF
          </button>
          <button
            type="button"
            onClick={onNewExperiment}
            className="flex items-center gap-2 px-3 py-2 text-[11.5px] font-semibold uppercase tracking-[1px] text-white bg-[#1F3D2E] rounded-lg hover:bg-[#163022]"
          >
            <Plus size={13} /> Yeni Deney
          </button>
        </div>
      </div>

      {/* Tablo */}
      {sorted.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#cdc4ad] rounded-xl">
          <p className="text-[13px] italic text-[#6f6749]">Henüz deney yok. + Yeni Deney ile ekle.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#cdc4ad] rounded-xl bg-white/70">
          <table className="w-full">
            <thead>
              <tr className="text-[10.5px] font-semibold tracking-[1.2px] uppercase text-[#6f6749] border-b border-[#cdc4ad] bg-[#ece4cf]/30">
                <th className="px-4 py-3 text-left w-12">#</th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => toggleSort('title')} className="inline-flex items-center gap-1 hover:text-[#1F3D2E]">
                    Deney {sortIcon('title')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => toggleSort('bet')} className="inline-flex items-center gap-1 hover:text-[#1F3D2E]">
                    BET {sortIcon('bet')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => toggleSort('sem')} className="inline-flex items-center gap-1 hover:text-[#1F3D2E]">
                    SEM {sortIcon('sem')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => toggleSort('yieldPct')} className="inline-flex items-center gap-1 hover:text-[#1F3D2E]">
                    Verim {sortIcon('yieldPct')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button onClick={() => toggleSort('amount')} className="inline-flex items-center gap-1 hover:text-[#1F3D2E]">
                    Miktar {sortIcon('amount')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">Notlar</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((e, idx) => {
                const TypeIcon = e.subType ? SUB_ICONS[e.subType] : FlaskConical;
                const betVal = getCharValue(e.id, 'BET');
                const semVal = getCharValue(e.id, 'SEM');
                return (
                  <tr
                    key={e.id}
                    className="border-b border-[#e6dfc8] last:border-0 hover:bg-[#f5efe0]/50 group/row cursor-pointer"
                    onClick={() => onSelectExperiment(e.id)}
                  >
                    <td className="px-4 py-3 text-[12px] font-mono text-[#6f6749]">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TypeIcon size={12} className="text-[#6f6749] shrink-0" />
                        <span className="text-[13px] font-semibold text-[#1F3D2E]">{e.title}</span>
                        {e.subType && (
                          <span className="text-[9.5px] font-semibold tracking-[1px] uppercase text-[#BA7517] bg-[#FAEEDA] px-1.5 py-0.5 rounded">
                            {SUB_TYPE_LABEL[e.subType]}
                          </span>
                        )}
                      </div>
                      <div className="text-[10.5px] text-[#6f6749] font-mono mt-0.5">
                        {formatDateShort(e.experimentDate)} · {authorName(e.authorId)} · {e.batchNo}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-center text-[#5a5240] font-mono">
                      {betVal ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-center text-[#5a5240]">
                      {semVal ? <span className="truncate inline-block max-w-32">{semVal}</span> : '—'}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-center text-[#5a5240] font-mono">
                      {e.yieldPct !== null ? `%${e.yieldPct}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-center text-[#5a5240]">
                      {e.amount ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[11.5px] text-[#5a5240] max-w-xs">
                      {e.generalOverview ? (
                        <span className="line-clamp-1">{e.generalOverview}</span>
                      ) : (
                        <button
                          onClick={(ev) => { ev.stopPropagation(); onSelectExperiment(e.id); }}
                          className="italic text-[#9b9275] hover:text-[#1F3D2E] hover:underline"
                        >
                          + not ekle
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="opacity-0 group-hover/row:opacity-100 flex items-center justify-end gap-1 transition-opacity">
                        {onEditExperiment && (
                          <button
                            onClick={(ev) => { ev.stopPropagation(); onEditExperiment(e); }}
                            className="p-1 text-[#6f6749] hover:text-[#1F3D2E] hover:bg-white rounded"
                            title="Düzenle"
                          >
                            <Pencil size={11} />
                          </button>
                        )}
                        <button
                          onClick={(ev) => { ev.stopPropagation(); handleDelete(e); }}
                          className="p-1 text-[#791F1F] hover:bg-white rounded"
                          title="Sil"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
