import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, FlaskConical, Plus, Archive } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { usePortalUsers } from '../../../../lib/users';
import { useNotifications } from '../../../../lib/notifications';
import { useActiveEntity } from '../../../../lib/active-entity';
import type { ModuleProps, User } from '../../../../types/portal';
import { BreadcrumbHome } from '../../../BreadcrumbHome';
import { confirmAction } from '../../../../lib/confirm';
import { ExperimentRow } from './ExperimentRow';
import { ExperimentModal } from './ExperimentModal';
import { formatRelativeWeek, formatWeekRange, groupByWeek } from './utils';
import type { Experiment, ViewMode } from './types';
import { useExperiments, useLabDevices } from './hooks';

export const ResearchPlan: React.FC<ModuleProps> = ({ user }) => {
  const { experiments, addExperiment: addExperimentRow, updateExperiment: updateExperimentRow, deleteExperiment: deleteExperimentRow } = useExperiments();
  const { devices, addDevice } = useLabDevices();
  const { users } = usePortalUsers();
  const { dispatch } = useNotifications();
  const { active, clear } = useActiveEntity();

  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const userById = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of users) map.set(u.id, u);
    return map;
  }, [users]);

  const archiveCount = useMemo(
    () => experiments.filter((e) => e.archived).length,
    [experiments]
  );

  const visible = useMemo(() => {
    return experiments.filter((e) => {
      if (viewMode === 'active' && e.archived) return false;
      if (viewMode === 'archive' && !e.archived) return false;
      if (ownerFilter !== 'all' && e.ownerId !== ownerFilter) return false;
      return true;
    });
  }, [experiments, viewMode, ownerFilter]);

  const groups = useMemo(() => groupByWeek(visible), [visible]);

  // Notification deep-link
  useEffect(() => {
    if (active?.source !== 'arge') return;
    const target = experiments.find((e) => e.id === active.entityId);
    if (!target) {
      clear();
      return;
    }
    setViewMode(target.archived ? 'archive' : 'active');
    setEditingId(target.id);
    clear();
  }, [active, experiments, clear]);

  const editingExperiment = editingId ? experiments.find((e) => e.id === editingId) : undefined;

  const updateExperiment = (id: string, patch: Partial<Experiment>) => {
    const target = experiments.find((e) => e.id === id);
    updateExperimentRow(id, patch);
    if (!target) return;
    const newOwnerId = patch.ownerId;
    if (newOwnerId && newOwnerId !== target.ownerId && newOwnerId !== user.id) {
      dispatch({
        type: 'experiment-assigned',
        source: 'arge',
        entityId: id,
        entityTitle: patch.name ?? target.name ?? target.code,
        actorId: user.id,
        targetUserIds: [newOwnerId],
        message: `size bir Ar-Ge deneyi atadı: "${patch.name ?? target.name ?? target.code}"`,
      });
    }
  };

  const addExperiment = async (input: Partial<Experiment>) => {
    const next = await addExperimentRow(input, user.id);
    setCreating(false);
    if (next && next.ownerId && next.ownerId !== user.id) {
      dispatch({
        type: 'experiment-assigned',
        source: 'arge',
        entityId: next.id,
        entityTitle: next.name || next.code,
        actorId: user.id,
        targetUserIds: [next.ownerId],
        message: `size yeni bir Ar-Ge deneyi atadı: "${next.name || next.code}"`,
      });
    }
  };

  const deleteExperiment = async (id: string) => {
    const ok = await confirmAction({
      title: 'Deneyi sil?',
      message: 'Bu deney kalıcı olarak silinecek.',
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (!ok) return;
    deleteExperimentRow(id);
    setEditingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 pb-10 space-y-5">
      {/* Breadcrumb */}
      <div className="bg-white px-5 py-3 border border-border/40 rounded-xl flex items-center gap-2 text-[13px] text-text-3 font-medium">
        <BreadcrumbHome />
        <span>/</span>
        <span className="text-text font-semibold">Ar-Ge Planı</span>
      </div>

      {/* Module card */}
      <div className="bg-surface border border-border/40 rounded-2xl p-6 md:p-8 space-y-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <FlaskConical size={20} className="text-text" />
              <h1 className="text-[20px] font-bold text-text tracking-tight">Ar-Ge Deney Planı</h1>
            </div>
            <p className="text-[13px] text-text-3 mt-1.5">
              Stratejik yol haritası — MOF sentez programı, cihaz ve karakterizasyon takibi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Legend */}
            <div className="hidden md:flex items-center gap-3 text-[12px] text-text-3 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-info-border" /> Sentez
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-text" /> Work-up
              </span>
            </div>

            {/* Archive toggle */}
            <button
              type="button"
              onClick={() => setViewMode((m) => (m === 'active' ? 'archive' : 'active'))}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold border transition-colors',
                viewMode === 'archive'
                  ? 'bg-text text-white border-text'
                  : 'bg-surface border-border text-text-2 hover:border-text/30'
              )}
            >
              {viewMode === 'archive' ? (
                <>
                  <ChevronLeft size={13} /> Aktif liste
                </>
              ) : (
                <>
                  <Archive size={13} /> Arşiv ({archiveCount})
                </>
              )}
            </button>

            {/* Owner filter */}
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="px-3 py-2 bg-surface border border-border rounded-lg text-[12px] font-semibold text-text-2 outline-none focus:border-text"
            >
              <option value="all">Tüm kişiler</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>

            {/* Yeni deney */}
            {viewMode === 'active' && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 bg-purple-text text-white px-4 py-2 rounded-lg font-semibold text-[13px] hover:opacity-90 transition-all shadow-sm active:scale-95"
              >
                <Plus size={15} /> Yeni deney
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full min-w-275 border-collapse">
            <thead>
              <tr className="text-[10px] font-semibold uppercase tracking-widest text-text-3 bg-surface-2/40">
                <th className="px-3 py-2 text-left">Gün</th>
                <th className="px-3 py-2 text-left">Kod</th>
                <th className="px-3 py-2 text-left">Deney</th>
                <th className="px-3 py-2 text-left">MOF</th>
                <th className="px-3 py-2 text-left">Amaç</th>
                <th className="px-3 py-2 text-left">Sentez</th>
                <th className="px-3 py-2 text-left">Work-up</th>
                <th className="px-3 py-2 text-left">Cihaz</th>
                <th className="px-3 py-2 text-center">BET</th>
                <th className="px-3 py-2 text-center">XRD</th>
                <th className="px-3 py-2 text-center">SEM</th>
                <th className="px-3 py-2 text-left">Kim</th>
                <th className="px-3 py-2 text-left">ELN</th>
                <th className="px-3 py-2 text-left">Durum</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={15} className="text-center py-10 text-[13px] text-text-3">
                    {viewMode === 'archive'
                      ? 'Arşivde deney yok.'
                      : 'Henüz deney eklenmedi. "+ Yeni deney" ile başlayın.'}
                  </td>
                </tr>
              ) : (
                groups.flatMap((group) => [
                  <tr key={`week-${group.weekKey}`} className="bg-purple-bg/40">
                    <td colSpan={15} className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-purple-text">
                      {formatRelativeWeek(group.monday)} · {formatWeekRange(group.monday)} · {group.experiments.length} DENEY
                    </td>
                  </tr>,
                  ...group.experiments.map((e) => (
                    <ExperimentRow
                      key={e.id}
                      experiment={e}
                      devices={devices}
                      owner={userById.get(e.ownerId)}
                      onUpdate={updateExperiment}
                      onAddDevice={addDevice}
                      onDelete={deleteExperiment}
                      onOpenEdit={setEditingId}
                    />
                  )),
                ])
              )}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-text-3 italic">
          Detaylar ve protokoller için her satıra tıkla (Confluence/ELN linki eklenebilir).
        </p>
      </div>

      {/* Create modal */}
      {creating && (
        <ExperimentModal
          mode="create"
          users={users}
          devices={devices}
          currentUserId={user.id}
          onAddDevice={addDevice}
          onSave={(input) => addExperiment(input)}
          onClose={() => setCreating(false)}
        />
      )}

      {/* Edit modal */}
      {editingExperiment && (
        <ExperimentModal
          mode="edit"
          experiment={editingExperiment}
          users={users}
          devices={devices}
          currentUserId={user.id}
          onAddDevice={addDevice}
          onSave={(patch) => {
            updateExperiment(editingExperiment.id, patch);
            setEditingId(null);
          }}
          onDelete={() => deleteExperiment(editingExperiment.id)}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
};
