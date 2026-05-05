import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { ModuleProps, User } from '../../../../types/portal';
import { usePortalUsers } from '../../../../lib/users';
import { BreadcrumbHome } from '../../../BreadcrumbHome';
import { confirmAction } from '../../../../lib/confirm';
import { SOPCard } from './components/SOPCard';
import { SOPModal } from './components/SOPModal';
import { useSOPs } from './hooks';
import { SOP_CATEGORIES } from './types';
import type { SOPCategory, SOPProcedure } from './types';

type CategoryFilter = SOPCategory | 'all';

export const SOP: React.FC<ModuleProps> = ({ user }) => {
  const { items, addItem, updateItem, deleteItem } = useSOPs();
  const { users } = usePortalUsers();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<SOPProcedure | 'new' | null>(null);

  const userById = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of users) map.set(u.id, u);
    return map;
  }, [users]);

  const counts = useMemo(() => {
    const c: Record<CategoryFilter, number> = {
      all: items.length,
      sentez: 0,
      karakterizasyon: 0,
      'kalite-kontrol': 0,
      guvenlik: 0,
      'cihaz-kullanimi': 0,
      'satin-alma': 0,
      'ihracat-sevkiyat': 0,
      idari: 0,
    };
    for (const it of items) c[it.category] += 1;
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr');
    return items.filter((it) => {
      if (activeCategory !== 'all' && it.category !== activeCategory) return false;
      if (!q) return true;
      const haystack = [
        it.title,
        it.summary ?? '',
        it.tags.join(' '),
      ]
        .join(' ')
        .toLocaleLowerCase('tr');
      return haystack.includes(q);
    });
  }, [items, activeCategory, search]);

  const activeLabel =
    activeCategory === 'all'
      ? 'Tümü'
      : SOP_CATEGORIES.find((c) => c.id === activeCategory)?.label ?? 'Tümü';

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-5">
      <div className="bg-white px-5 py-3 border border-border/40 rounded-xl flex items-center gap-2 text-[13px] text-text-3 font-medium">
        <BreadcrumbHome />
        <span>/</span>
        <span className="text-text font-semibold">SOP / Prosedür</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <aside className="lg:w-60 shrink-0 space-y-3">
          <div className="bg-white border-[0.5px] border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <span className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3">
                Kategoriler
              </span>
            </div>
            <div className="pb-2">
              <CategoryRow
                label="Tümü"
                count={counts.all}
                dot="bg-purple-500"
                active={activeCategory === 'all'}
                onClick={() => setActiveCategory('all')}
              />
              {SOP_CATEGORIES.map((c) => (
                <CategoryRow
                  key={c.id}
                  label={c.label}
                  count={counts[c.id]}
                  dot={c.dot}
                  active={activeCategory === c.id}
                  onClick={() => setActiveCategory(c.id)}
                />
              ))}
            </div>
            <div className="px-3 pb-3 pt-1 border-t border-border/30">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ara..."
                  className="w-full pl-7 pr-2.5 py-1.5 bg-surface-2/50 border border-border/50 rounded-lg text-[12.5px] outline-none focus:border-text/40 transition-colors"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-[18px] font-semibold text-text tracking-tight">{activeLabel}</h2>
              <p className="text-[12.5px] text-text-3 mt-0.5">{filtered.length} prosedür</p>
            </div>
            <button
              onClick={() => setModal('new')}
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-[13px] font-semibold shadow-sm hover:bg-teal-700 transition-colors active:scale-95"
            >
              <Plus size={15} /> Yeni prosedür
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-surface-2/40 border border-dashed border-border rounded-2xl p-10 text-center">
              <p className="text-[13px] text-text-3">
                {items.length === 0
                  ? 'Henüz prosedür eklenmedi. "Yeni prosedür" ile başlayın.'
                  : 'Aramaya / filtreye uyan prosedür bulunamadı.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((it) => (
                <SOPCard
                  key={it.id}
                  item={it}
                  owner={userById.get(it.ownerId)}
                  onClick={() => setModal(it)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {modal && (
        <SOPModal
          item={modal === 'new' ? undefined : modal}
          currentUserId={user.id}
          onClose={() => setModal(null)}
          onSave={async (data) => {
            if (modal === 'new') {
              await addItem(data);
            } else {
              await updateItem(modal.id, data);
            }
            setModal(null);
          }}
          onDelete={
            modal !== 'new'
              ? async () => {
                  const ok = await confirmAction({
                    title: 'Prosedürü sil?',
                    message: 'Bu prosedür kalıcı olarak silinecek.',
                    confirmText: 'Sil',
                    variant: 'danger',
                  });
                  if (!ok) return;
                  await deleteItem(modal.id);
                  setModal(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
};

interface CategoryRowProps {
  label: string;
  count: number;
  dot: string;
  active: boolean;
  onClick: () => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ label, count, dot, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors',
      active ? 'bg-[#ECE4F7] text-[#4a2e85]' : 'hover:bg-surface-2 text-text-2'
    )}
  >
    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
    <span className="flex-1 text-[12.5px] font-medium truncate">{label}</span>
    <span
      className={cn(
        'text-[10.5px] font-semibold',
        active ? 'text-[#4a2e85]' : 'text-text-3'
      )}
    >
      {count}
    </span>
  </button>
);

export default SOP;
