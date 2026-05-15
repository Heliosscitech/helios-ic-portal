import React, { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { cn } from '../../../../../../lib/utils';
import { useLabBook } from '../../context';
import type { LiteratureItem } from '../../types';
import { EmptyState } from '../EmptyState';
import { LiteratureDetailView } from '../LiteratureDetailView';
import { LiteratureModal } from '../modals/LiteratureModal';

export const LiteraturTab: React.FC = () => {
  const {
    user, search,
    literature: { items },
    literatureSelectedId, setLiteratureSelectedId,
  } = useLabBook();

  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; item?: LiteratureItem } | null>(null);

  let visibleItems = items;
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    visibleItems = items.filter((i) =>
      i.title.toLowerCase().includes(q) ||
      (i.authors ?? '').toLowerCase().includes(q) ||
      (i.journal ?? '').toLowerCase().includes(q) ||
      (i.subject ?? '').toLowerCase().includes(q) ||
      (i.summary ?? '').toLowerCase().includes(q) ||
      (i.heliosNotes ?? '').toLowerCase().includes(q)
    );
  }

  const selected = items.find((i) => i.id === literatureSelectedId) ?? null;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sol sidebar */}
      <aside className="w-85 shrink-0 border-r border-[#cdc4ad] overflow-y-auto">
        <div className="px-5 py-5 flex items-center justify-between border-b border-[#cdc4ad]/70">
          <h2 className="helios-eln-title text-[22px] font-bold">Literatür</h2>
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-1 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[1px] text-[#1F3D2E] border border-[#cdc4ad] rounded-md hover:bg-[#ece4cf]"
          >
            <Plus size={11} /> Ekle
          </button>
        </div>

        {visibleItems.length === 0 ? (
          <p className="px-5 py-6 text-[12.5px] italic text-[#6f6749] text-center">
            {search.trim() ? 'Eşleşme yok' : 'Henüz kayıt yok'}
          </p>
        ) : (
          <div className="py-1">
            {visibleItems.map((i) => {
              const isSelected = literatureSelectedId === i.id;
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setLiteratureSelectedId(i.id)}
                  className={cn(
                    'w-full text-left px-5 py-3 border-b border-[#e6dfc8] transition-colors',
                    isSelected ? 'bg-[#ece4cf]' : 'hover:bg-[#f5efe0]'
                  )}
                >
                  <div className="text-[13px] font-semibold text-[#1F3D2E] line-clamp-2 leading-snug">{i.title}</div>
                  <div className="mt-0.5 text-[10.5px] text-[#6f6749] font-mono">
                    {i.authors ?? '—'}{i.year ? ` · ${i.year}` : ''}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </aside>

      {/* Sağ panel */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {selected ? (
          <LiteratureDetailView item={selected} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState
              icon={BookOpen}
              title="Literatür Taraması"
              subtitle="Soldan bir kayıt seç, ya da yeni bir kayıt ekle."
            />
          </div>
        )}

        {/* Footer */}
        <footer className="px-8 py-3 border-t border-[#cdc4ad] flex items-center justify-between text-[10.5px] font-semibold tracking-[1.2px] uppercase text-[#6f6749]">
          <span>Helios Bilim ve Teknoloji A.Ş. · Teknopark İstanbul</span>
          <span>Paylaşımlı Kayıt — Tüm Ekip Görür</span>
        </footer>
      </main>

      {modal && (
        <LiteratureModal
          mode={modal.mode}
          item={modal.item}
          currentUserId={user.id}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};
