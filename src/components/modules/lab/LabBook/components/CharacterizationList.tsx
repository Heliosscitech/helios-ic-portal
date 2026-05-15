import React, { useState } from 'react';
import { Plus, Pencil, Trash2, ExternalLink, Calendar } from 'lucide-react';
import { confirmAction } from '../../../../../lib/confirm';
import { getCachedUsers } from '../../../../../lib/users';
import { useLabBook } from '../context';
import { formatDateShort } from '../types';
import type { ExperimentCharacterization } from '../types';
import { CharacterizationModal } from './modals/CharacterizationModal';

interface Props {
  experimentId:    string;
  experimentTitle: string;
  currentUserId:   string;
  /** Parent edit moduna girdiğinde edit/sil butonları her zaman görünür */
  editing?:        boolean;
}

export const CharacterizationList: React.FC<Props> = ({ experimentId, experimentTitle, currentUserId, editing }) => {
  const { mof: { characterizations, deleteCharacterization } } = useLabBook();
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; item?: ExperimentCharacterization } | null>(null);

  const users = getCachedUsers();
  const expChars = characterizations
    .filter((c) => c.experimentId === experimentId)
    .sort((a, b) => a.position - b.position);

  const handleDelete = async (c: ExperimentCharacterization) => {
    const ok = await confirmAction({
      title: 'Karakterizasyonu sil?',
      message: `"${c.type}" analizi silinecek.`,
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (ok) deleteCharacterization(c.id);
  };

  const performerName = (legacyId: string | null) =>
    legacyId ? users.find((u) => u.id === legacyId)?.name ?? legacyId : '—';

  return (
    <section className="pb-4">
      <div className="flex items-center justify-between mb-3 pt-4 border-t border-[#cdc4ad]">
        <h3 className="helios-eln-title text-[18px] font-bold">Karakterizasyonlar</h3>
        <button
          type="button"
          onClick={() => setModal({ mode: 'add' })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-[#1F3D2E] border border-[#cdc4ad] rounded-lg hover:bg-[#ece4cf]"
        >
          <Plus size={12} /> Analiz Ekle
        </button>
      </div>

      {expChars.length === 0 ? (
        <div className="py-10 text-center border-2 border-dashed border-[#cdc4ad] rounded-xl">
          <p className="text-[12.5px] italic text-[#9b9275]">Henüz analiz eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {expChars.map((c) => (
            <div key={c.id} className="bg-white/70 border border-[#cdc4ad] rounded-xl p-4 group/card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[1px] text-[#1F3D2E] bg-[#ece4cf] rounded-md">
                    {c.type}
                  </span>
                  {c.value && (
                    <div className="mt-2 text-[15px] font-mono font-semibold text-[#1F3D2E]">{c.value}</div>
                  )}
                </div>
                <div className={`flex items-center gap-0.5 ${editing ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'} transition-opacity shrink-0`}>
                  <button
                    onClick={() => setModal({ mode: 'edit', item: c })}
                    className="p-1 text-[#6f6749] hover:text-[#1F3D2E] hover:bg-[#ece4cf] rounded"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-1 text-[#791F1F] hover:bg-[#ece4cf] rounded"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              <div className="mt-2 flex items-center gap-3 text-[10.5px] text-[#6f6749]">
                {c.performedAt && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={10} /> {formatDateShort(c.performedAt)}
                  </span>
                )}
                <span>{performerName(c.performedById)}</span>
              </div>

              {c.imageUrl && (
                <a href={c.imageUrl} target="_blank" rel="noreferrer" className="block mt-2 rounded-lg overflow-hidden border border-[#cdc4ad]">
                  <img src={c.imageUrl} alt={c.type} className="w-full h-32 object-cover" />
                </a>
              )}

              {c.attachmentUrl && (
                <a
                  href={c.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#0C447C] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={10} /> Drive
                </a>
              )}

              {c.notes && (
                <p className="mt-2 text-[11.5px] text-[#5a5240] whitespace-pre-wrap leading-snug border-t border-[#e6dfc8] pt-2">
                  {c.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <CharacterizationModal
          mode={modal.mode}
          experimentId={experimentId}
          experimentTitle={experimentTitle}
          characterization={modal.item}
          currentUserId={currentUserId}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
};
