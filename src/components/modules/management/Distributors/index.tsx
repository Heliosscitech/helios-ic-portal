import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Plus, Search, Users } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { usePortalUsers } from '../../../../lib/users';
import { useNotifications } from '../../../../lib/notifications';
import { useActiveEntity } from '../../../../lib/active-entity';
import type { ModuleProps, User } from '../../../../types/portal';
import {
  REGION_CONFIG,
  REGION_ORDER,
  STATUS_META,
  STATUS_ORDER,
} from './constants';
import { useDistributors } from './hooks';
import { DistributorCard } from './DistributorCard';
import { DistributorDetailModal } from './DistributorDetailModal';
import { computeStats, filterDistributors } from './utils';
import type { Distributor, DistributorRegion, DistributorStatus } from './types';

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => (
  <div className="bg-surface border border-border/40 rounded-xl p-4 flex flex-col gap-2">
    <span className="text-[10px] font-semibold uppercase tracking-widest text-text-3">{label}</span>
    <span className={cn('text-[28px] font-bold leading-none', color)}>{value}</span>
  </div>
);

export const Distributors: React.FC<ModuleProps> = ({ user }) => {
  const { distributors, addDistributor: addDistributorRow, updateDistributor: updateDistributorRow, deleteDistributor: deleteDistributorRow } = useDistributors();
  const { users } = usePortalUsers();
  const { dispatch } = useNotifications();
  const { active, clear } = useActiveEntity();

  const [activeRegion, setActiveRegion] = useState<DistributorRegion>('avrupa');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DistributorStatus | 'all'>('all');
  const [ownerFilter, setOwnerFilter] = useState<string | 'all' | 'unassigned'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const isAdmin = user.userRole === 'yonetici';

  const userById = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of users) map.set(u.id, u);
    return map;
  }, [users]);

  const stats = useMemo(() => computeStats(distributors), [distributors]);

  const regionCounts = useMemo(() => {
    const counts: Record<DistributorRegion, number> = {
      'avrupa': 0,
      'kuzey-amerika': 0,
      'guney-amerika': 0,
      'asya-pasifik': 0,
      'orta-dogu-kafrika': 0,
      'sahra-alti-afrika': 0,
      'okyanusya': 0,
    };
    for (const d of distributors) counts[d.region] += 1;
    return counts;
  }, [distributors]);

  const visible = useMemo(() => {
    const inRegion = distributors.filter((d) => d.region === activeRegion);
    return filterDistributors(inRegion, { search, status: statusFilter, ownerId: ownerFilter });
  }, [distributors, activeRegion, search, statusFilter, ownerFilter]);

  // Bildirim tıklanınca: ilgili kaydı bul, bölgesine geç, modalı aç
  useEffect(() => {
    if (active?.source !== 'distributor') return;
    const target = distributors.find((d) => d.id === active.entityId);
    if (!target) {
      clear();
      return;
    }
    // Bildirim deep-link akışı: dış (active-entity) context değiştiğinde
    // yerel UI state'ini eşitliyoruz, sonra context'i temizliyoruz.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveRegion(target.region);
    setEditingId(target.id);
    clear();
  }, [active, distributors, clear]);

  const editingDistributor = editingId ? distributors.find((d) => d.id === editingId) : undefined;

  const canManage = (d: Distributor): boolean => {
    if (isAdmin) return true;
    if (d.ownerId === null) return true;
    return d.ownerId === user.id;
  };

  const addDistributor = async (input: Partial<Distributor>) => {
    const next = await addDistributorRow(input);
    setCreating(false);
    if (!next) return;
    setActiveRegion(next.region);
    if (next.ownerId && next.ownerId !== user.id) {
      dispatch({
        type: 'distributor-assigned',
        source: 'distributor',
        entityId: next.id,
        entityTitle: next.name || next.country,
        actorId: user.id,
        targetUserIds: [next.ownerId],
        message: `size yeni bir distribütör atadı: "${next.name || next.country}"`,
      });
    }
  };

  const updateDistributor = (id: string, patch: Partial<Distributor>) => {
    const target = distributors.find((d) => d.id === id);
    if (!target || !canManage(target)) return;

    updateDistributorRow(id, patch);

    const newOwnerId = patch.ownerId;
    if (newOwnerId && newOwnerId !== target.ownerId && newOwnerId !== user.id) {
      dispatch({
        type: 'distributor-assigned',
        source: 'distributor',
        entityId: id,
        entityTitle: patch.name ?? target.name ?? target.country,
        actorId: user.id,
        targetUserIds: [newOwnerId],
        message: `size bir distribütör atadı: "${patch.name ?? target.name ?? target.country}"`,
      });
    }

    setEditingId(null);
  };

  const deleteDistributor = (id: string) => {
    const target = distributors.find((d) => d.id === id);
    if (!target || !canManage(target)) return;
    if (!window.confirm('Bu distribütör kaydını silmek istediğinize emin misiniz?')) return;
    deleteDistributorRow(id);
    setEditingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 pb-10 space-y-5">
      {/* Breadcrumb */}
      <div className="bg-white px-5 py-3 border border-border/40 rounded-xl flex items-center gap-2 text-[13px] text-text-3 font-medium">
        <ChevronLeft size={14} />
        <span className="hover:text-text cursor-pointer">Uygulamalar</span>
        <span>/</span>
        <span className="text-text font-semibold">Distribütör</span>
      </div>

      {/* Module card */}
      <div className="bg-surface border border-border/40 rounded-2xl p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Users size={20} className="text-text" />
              <h1 className="text-[20px] font-bold text-text tracking-tight">Distribütör Takibi</h1>
            </div>
            <p className="text-[13px] text-text-3 mt-1.5">
              MOF ihracat için potansiyel distribütörler — araştırma, iletişim, takip
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-purple-text text-white px-4 py-2.5 rounded-xl font-semibold text-[13px] hover:opacity-90 transition-all shadow-sm active:scale-95 self-start"
          >
            <Plus size={16} /> Yeni distribütör
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Toplam"        value={stats.total}     color="text-text" />
          <StatCard label="Araştırılacak" value={stats.research}  color="text-purple-text" />
          <StatCard label="Mail atıldı"   value={stats.mailSent}  color="text-amber-text" />
          <StatCard label="Numune"        value={stats.sample}    color="text-text-3" />
          <StatCard label="Sözleşme"      value={stats.contract}  color="text-teal-text" />
          <StatCard label="Pasif"         value={stats.passive}   color="text-red-text" />
        </div>

        {/* Region tabs */}
        <div className="border-b border-border flex gap-1 overflow-x-auto -mx-1 px-1">
          {REGION_ORDER.map((r) => {
            const meta = REGION_CONFIG[r];
            const tabActive = activeRegion === r;
            return (
              <button
                key={r}
                onClick={() => setActiveRegion(r)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px',
                  tabActive
                    ? 'border-info-border text-text'
                    : 'border-transparent text-text-3 hover:text-text-2'
                )}
              >
                {meta.label}
                <span className={cn(
                  'text-[11px] font-bold px-1.5 rounded-full min-w-5 text-center',
                  tabActive ? 'bg-text text-white' : 'bg-surface-2 text-text-3'
                )}>
                  {regionCounts[r]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Distribütör, ülke, not..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DistributorStatus | 'all')}
            className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors"
          >
            <option value="all">Tüm durumlar</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-text transition-colors"
          >
            <option value="all">Tüm sorumlular</option>
            <option value="unassigned">Atanmamış</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.length === 0 ? (
            <div className="col-span-full bg-surface-2/40 border border-dashed border-border rounded-2xl p-10 text-center">
              <p className="text-[13px] text-text-3">
                {distributors.filter((d) => d.region === activeRegion).length === 0
                  ? `${REGION_CONFIG[activeRegion].label} bölgesinde henüz kayıt yok. "Yeni distribütör" ile başlayın.`
                  : 'Filtrelere uyan kayıt bulunamadı.'}
              </p>
            </div>
          ) : (
            visible.map((d) => (
              <DistributorCard
                key={d.id}
                distributor={d}
                owner={d.ownerId ? userById.get(d.ownerId) : undefined}
                onClick={() => setEditingId(d.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Create modal */}
      {creating && (
        <DistributorDetailModal
          mode="create"
          users={users}
          canManage={true}
          onSave={(input) => addDistributor(input as Partial<Distributor>)}
          onClose={() => setCreating(false)}
        />
      )}

      {/* Edit modal */}
      {editingDistributor && (
        <DistributorDetailModal
          mode="edit"
          distributor={editingDistributor}
          users={users}
          canManage={canManage(editingDistributor)}
          onSave={(patch) => updateDistributor(editingDistributor.id, patch as Partial<Distributor>)}
          onDelete={() => deleteDistributor(editingDistributor.id)}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
};
