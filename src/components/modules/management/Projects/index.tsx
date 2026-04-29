import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, ChevronRight, Trash2, Plus, X,
  TrendingUp, Clock, Activity, Pencil,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { PORTAL_USERS } from '../../../../types/users';
import type { Project, ReportPeriod, WPStatus, NewProjectFormData } from './types';
import { formatTR, daysUntil } from '../../../../lib/dates';
import { useProjects } from './hooks';

const SELECT_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")";

const selectStyle = {
  backgroundImage: SELECT_BG,
  backgroundRepeat: 'no-repeat' as const,
  backgroundPosition: 'right 0.25rem center',
  backgroundSize: '0.75rem',
};

const WP_STATUS_STYLES: Record<WPStatus, string> = {
  bekliyor: 'bg-surface-2 text-text-3',
  devam: 'bg-amber-bg text-amber-text',
  tamam: 'bg-teal-bg text-teal-text',
};

const WP_STATUS_LABELS: Record<WPStatus, string> = {
  bekliyor: 'Bekliyor',
  devam: 'Devam',
  tamam: 'Tamam',
};

const PROJECT_STATUS_STYLES: Record<Project['status'], string> = {
  aktif: 'bg-teal-bg text-teal-text',
  tamamlandi: 'bg-surface-2 text-text-3',
  duraklatildi: 'bg-amber-bg text-amber-text',
};

const PROJECT_STATUS_LABELS: Record<Project['status'], string> = {
  aktif: 'Aktif',
  tamamlandi: 'Tamamlandı',
  duraklatildi: 'Duraklatıldı',
};

const getUser = (id: string) => PORTAL_USERS.find((u) => u.id === id);

const completionPct = (wps: Project['workPackages']) =>
  wps.length === 0 ? 0 : Math.round((wps.filter((wp) => wp.status === 'tamam').length / wps.length) * 100);

export const Projects: React.FC = () => {
  const {
    projects,
    addProject: addProjectRow,
    updateProjectMeta,
    deleteProject: deleteProjectRow,
    updateProjectNotes: updateProjectNotesRow,
    addWP: addWPRow,
    updateWP: updateWPRow,
    deleteWP: deleteWPRow,
    addReportPeriod: addReportPeriodRow,
    updateReportPeriod: updateReportPeriodRow,
    deleteReportPeriod: deleteReportPeriodRow,
  } = useProjects();
  const [activeId, setActiveId] = useState<string>('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // İlk proje yüklendiğinde activeId'yi set et
  useEffect(() => {
    if (!activeId && projects.length > 0) setActiveId(projects[0].id);
  }, [activeId, projects]);

  const active = projects.find((p) => p.id === activeId) ?? projects[0];

  // ── WP handlers ──────────────────────────────────────────
  const updateWP = (wpId: string, patch: Partial<Project['workPackages'][0]>) => {
    if (!active) return;
    updateWPRow(active.id, wpId, patch);
  };

  const addWP = () => {
    if (!active) return;
    addWPRow(active.id);
  };

  const deleteWP = (wpId: string) => {
    if (!active) return;
    deleteWPRow(active.id, wpId);
  };

  // ── Report period handlers ───────────────────────────────
  const updateReportPeriod = (periodId: string, patch: Partial<ReportPeriod>) => {
    if (!active) return;
    updateReportPeriodRow(active.id, periodId, patch);
  };

  const addReportPeriod = () => {
    if (!active) return;
    addReportPeriodRow(active.id);
  };

  const deleteReportPeriod = (periodId: string) => {
    if (!active) return;
    deleteReportPeriodRow(active.id, periodId);
  };

  // ── Notes handler ─────────────────────────────────────────
  const updateProjectNotes = (notes: string) => {
    if (!active) return;
    updateProjectNotesRow(active.id, notes);
  };

  // ── Delete project ────────────────────────────────────────
  const deleteProject = async () => {
    if (!active) return;
    if (!window.confirm(`"${active.name}" projesini silmek istediğinize emin misiniz?`)) return;
    const remaining = projects.filter((p) => p.id !== active.id);
    await deleteProjectRow(active.id);
    if (remaining.length > 0) setActiveId(remaining[0].id);
    else setActiveId('');
  };

  // ── Add new project ───────────────────────────────────────
  const addProject = async (data: NewProjectFormData) => {
    const created = await addProjectRow(data);
    if (created) setActiveId(created.id);
    setShowNewModal(false);
  };

  // ── Edit project metadata ─────────────────────────────────
  const editProject = async (data: NewProjectFormData) => {
    if (!active) return;
    await updateProjectMeta(active.id, data);
    setShowEditModal(false);
  };

  if (!active) {
    return (
      <div className="max-w-7xl mx-auto p-8 md:p-10">
        <div className="bg-white border-[0.5px] border-border rounded-3xl shadow-sm py-20 px-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[#ECE4F7] text-[#4a2e85] flex items-center justify-center mb-5">
            <FolderOpen size={26} />
          </div>
          <h3 className="text-[17px] font-semibold text-text mb-1.5">Henüz proje yok</h3>
          <p className="text-[13px] text-text-3 max-w-sm mb-6 leading-relaxed">
            Ar-Ge ve iş geliştirme projelerini yönetmek, iş paketlerini takip
            etmek ve raporları planlamak için ilk projeyi ekle.
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-[#4a2e85] text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold shadow-sm hover:bg-[#3a2168] transition-colors active:scale-95"
          >
            <Plus size={15} /> Yeni proje ekle
          </button>
        </div>

        {showNewModal && (
          <ProjectFormModal
            onClose={() => setShowNewModal(false)}
            onSave={addProject}
          />
        )}
      </div>
    );
  }

  const completion = completionPct(active.workPackages);
  const members = active.memberIds.map(getUser).filter(Boolean) as (typeof PORTAL_USERS)[number][];
  const leader = getUser(active.leaderId);
  const projectDaysLeft = daysUntil(active.endDate);

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-10">
      <div className="flex gap-7">

        {/* ── Sidebar ── */}
        <aside className="w-56 shrink-0">
          <div className="bg-white border-[0.5px] border-border rounded-2xl shadow-sm overflow-hidden mb-3">
            <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-border/40">
              <FolderOpen size={14} className="text-text-3" />
              <span className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3">Projeler</span>
            </div>
            <div className="py-2">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveId(p.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all group',
                    activeId === p.id ? 'bg-[#ECE4F7] text-[#4a2e85]' : 'hover:bg-surface-2 text-text-2'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full shrink-0', p.color)} />
                  <span className="flex-1 text-[13px] font-semibold truncate">{p.name}</span>
                  <span className={cn(
                    'text-[10.5px] font-semibold px-1.5 py-0.5 rounded shrink-0',
                    activeId === p.id ? 'bg-[#d8c9f5] text-[#4a2e85]' : 'bg-surface-2 text-text-3'
                  )}>
                    {p.reportPeriods.length}
                  </span>
                  <ChevronRight
                    size={12}
                    className={cn('shrink-0 transition-opacity', activeId === p.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}
                  />
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold text-text-3 hover:text-info-text transition-colors"
          >
            <Plus size={13} /> Yeni proje
          </button>
        </aside>

        {/* ── Main panel ── */}
        <main className="flex-1 min-w-0 flex flex-col gap-5">

          {/* Header card */}
          <div className="bg-white border-[0.5px] border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="flex">
              <div className={cn('w-1.5 shrink-0', active.color)} />
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide bg-amber-bg text-amber-text border border-amber-border/30">
                      {active.name.split(' ')[0]}
                    </span>
                    <span className="font-mono text-[11px] text-text-3 bg-surface-2 px-2 py-0.5 rounded">
                      {active.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex -space-x-2">
                      {members.slice(0, 4).map((u) => (
                        <span
                          key={u.id}
                          title={u.name}
                          className={cn('w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10.5px] font-semibold', u.color)}
                        >
                          {u.initials}
                        </span>
                      ))}
                      {members.length > 4 && (
                        <span className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10.5px] font-semibold bg-surface-2 text-text-3">
                          +{members.length - 4}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="p-1.5 text-text-3 hover:text-info-text hover:bg-surface-2 rounded-lg transition-colors"
                      title="Projeyi düzenle"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={deleteProject}
                      className="p-1.5 text-text-3 hover:text-red-text hover:bg-red-bg rounded-lg transition-colors"
                      title="Projeyi sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <h2 className="text-[17px] font-semibold text-text tracking-tight mb-1">
                  {active.name} — {active.subtitle ?? active.code}
                </h2>
                <p className="text-[13px] text-text-3">
                  {formatTR(active.startDate)} → {formatTR(active.endDate)}
                  {leader && (
                    <> · Lider: <span className="font-medium text-text-2">{leader.name}</span></>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border-[0.5px] border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-1.5 text-text-3 mb-3">
                <TrendingUp size={12} />
                <span className="text-[10.5px] font-semibold uppercase tracking-wider">İlerleme</span>
              </div>
              <p className="text-[17px] font-semibold text-text mb-2">%{completion}</p>
              <div className="h-1 bg-surface-2 rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${completion}%` }} />
              </div>
              <p className="text-[10.5px] text-text-3">
                {active.workPackages.filter((w) => w.status === 'tamam').length}/{active.workPackages.length} paket tamam
              </p>
            </div>

            <div className="bg-white border-[0.5px] border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-1.5 text-text-3 mb-3">
                <Clock size={12} />
                <span className="text-[10.5px] font-semibold uppercase tracking-wider">Kalan Süre</span>
              </div>
              <p className="text-[17px] font-semibold text-text mb-2">
                {projectDaysLeft === null
                  ? '—'
                  : projectDaysLeft >= 0
                    ? `${projectDaysLeft} gün`
                    : `${Math.abs(projectDaysLeft)} gün geçti`}
              </p>
              <p className="text-[10.5px] text-text-3">Son: {formatTR(active.endDate)}</p>
            </div>

            <div className="bg-white border-[0.5px] border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-1.5 text-text-3 mb-3">
                <Activity size={12} />
                <span className="text-[10.5px] font-semibold uppercase tracking-wider">Durum</span>
              </div>
              <span className={cn('inline-block text-[12.5px] font-semibold px-2.5 py-1 rounded-lg mb-2', PROJECT_STATUS_STYLES[active.status])}>
                {PROJECT_STATUS_LABELS[active.status]}
              </span>
              <p className="text-[10.5px] text-text-3">{members.length} kişi</p>
            </div>
          </div>

          {/* İş Paketleri */}
          <div className="bg-white border-[0.5px] border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-border/30 flex items-center justify-between">
              <h3 className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3">İş Paketleri</h3>
              <button
                onClick={addWP}
                className="flex items-center gap-1 text-[11px] font-semibold text-text-3 hover:text-info-text transition-colors"
              >
                <Plus size={13} /> Ekle
              </button>
            </div>
            {active.workPackages.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-[13px] text-text-3 mb-3">Henüz iş paketi yok.</p>
                <button
                  onClick={addWP}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-info-text hover:underline"
                >
                  <Plus size={13} /> İlk iş paketini ekle
                </button>
              </div>
            ) : (
              <div>
                {active.workPackages.map((wp, idx) => (
                  <div
                    key={wp.id}
                    className={cn('px-6 py-4', idx < active.workPackages.length - 1 && 'border-b border-border/25')}
                  >
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="font-mono text-[10.5px] text-text-3 bg-surface-2 px-1.5 py-0.5 rounded shrink-0 min-w-[2.2rem] text-center">
                        {wp.id}
                      </span>
                      <input
                        value={wp.title}
                        onChange={(e) => updateWP(wp.id, { title: e.target.value })}
                        placeholder="İş paketi başlığı..."
                        className="flex-1 text-[14px] font-semibold text-text bg-transparent outline-none border-b border-transparent focus:border-border min-w-0 py-0.5 transition-colors placeholder:text-text-3/50 placeholder:font-normal"
                      />
                      <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded shrink-0', WP_STATUS_STYLES[wp.status])}>
                        {WP_STATUS_LABELS[wp.status]}
                      </span>
                      <input
                        type="date"
                        value={wp.deadline}
                        onChange={(e) => updateWP(wp.id, { deadline: e.target.value })}
                        className="text-[11px] text-text-3 font-mono bg-transparent outline-none border-b border-transparent focus:border-border shrink-0 py-0.5 transition-colors"
                      />
                      <select
                        value={wp.status}
                        onChange={(e) => updateWP(wp.id, { status: e.target.value as WPStatus })}
                        className="text-[12.5px] font-medium border border-border rounded-lg px-2 py-1 bg-white outline-none cursor-pointer appearance-none pr-6 shrink-0 text-text-2"
                        style={selectStyle}
                      >
                        {(Object.keys(WP_STATUS_LABELS) as WPStatus[]).map((s) => (
                          <option key={s} value={s}>{WP_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => deleteWP(wp.id)}
                        className="p-1 text-text-3 hover:text-red-text hover:bg-red-bg rounded transition-colors shrink-0"
                        title="İş paketini sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <textarea
                      value={wp.notes}
                      onChange={(e) => updateWP(wp.id, { notes: e.target.value })}
                      placeholder="Şu ana kadar ne yapıldı? Ne kaldı? Problemler..."
                      rows={2}
                      className="w-full text-[13px] text-text-2 bg-surface-2/50 border border-border/50 rounded-lg px-3 py-2 outline-none focus:border-info-border transition-colors resize-none placeholder:text-text-3/60"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rapor Dönemleri */}
          <div className="bg-white border-[0.5px] border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-border/30 flex items-center justify-between">
              <h3 className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3">Rapor Dönemleri</h3>
              <button
                onClick={addReportPeriod}
                className="flex items-center gap-1 text-[11px] font-semibold text-text-3 hover:text-info-text transition-colors"
              >
                <Plus size={13} /> Ekle
              </button>
            </div>
            {active.reportPeriods.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-[13px] text-text-3 mb-3">Henüz rapor dönemi yok.</p>
                <button
                  onClick={addReportPeriod}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-info-text hover:underline"
                >
                  <Plus size={13} /> İlk rapor dönemini ekle
                </button>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {active.reportPeriods.map((r) => {
                  const left = daysUntil(r.date);
                  return (
                    <div key={r.id} className="border-[0.5px] border-border rounded-xl p-4 relative group">
                      <button
                        onClick={() => deleteReportPeriod(r.id)}
                        className="absolute top-2 right-2 p-1 text-text-3 hover:text-red-text hover:bg-red-bg rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Dönemi sil"
                      >
                        <Trash2 size={12} />
                      </button>
                      <input
                        value={r.title}
                        onChange={(e) => updateReportPeriod(r.id, { title: e.target.value })}
                        placeholder="Başlık..."
                        className="w-full text-[10.5px] font-semibold text-text-3 uppercase tracking-wide mb-1 bg-transparent outline-none border-b border-transparent focus:border-border placeholder:text-text-3/50 placeholder:normal-case"
                      />
                      <div className="mb-3">
                        <input
                          type="date"
                          value={r.date}
                          onChange={(e) => updateReportPeriod(r.id, { date: e.target.value })}
                          className="text-[15px] font-semibold text-text bg-transparent outline-none border-b border-transparent focus:border-border w-full"
                        />
                        <p className="text-[11px] text-text-3 mt-0.5">{formatTR(r.date)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={r.status}
                          onChange={(e) => updateReportPeriod(r.id, { status: e.target.value as WPStatus })}
                          className="text-[11px] font-medium border border-border rounded-md px-1.5 py-0.5 bg-white outline-none cursor-pointer appearance-none pr-5 text-text-2"
                          style={{ ...selectStyle, backgroundSize: '0.65rem' }}
                        >
                          {(Object.keys(WP_STATUS_LABELS) as WPStatus[]).map((s) => (
                            <option key={s} value={s}>{WP_STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                        {left !== null && (
                          <span className="text-[10.5px] text-text-3">
                            {left >= 0 ? `${left} gün kaldı` : `${Math.abs(left)} gün geçti`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notlar */}
          <div className="bg-white border-[0.5px] border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-widest text-text-3 mb-3">Notlar</h3>
            <textarea
              value={active.notes}
              onChange={(e) => updateProjectNotes(e.target.value)}
              placeholder="Bu proje için serbest notlar..."
              rows={4}
              className="w-full text-[14px] text-text-2 bg-transparent border-0 outline-none resize-none placeholder:text-text-3/50"
            />
          </div>

          {/* Footer */}
          <div className="text-center py-4 opacity-60">
            <p className="text-[11px] text-text-3">
              Prototip görünüm · Veriler şu an tarayıcıda tutuluyor · © Helios Bilim ve Teknoloji A.Ş.
            </p>
          </div>
        </main>
      </div>

      {showNewModal && (
        <ProjectFormModal
          onClose={() => setShowNewModal(false)}
          onSave={addProject}
        />
      )}

      {showEditModal && (
        <ProjectFormModal
          initial={active}
          isEdit
          onClose={() => setShowEditModal(false)}
          onSave={editProject}
        />
      )}
    </div>
  );
};

// ── Project Form Modal (create + edit) ───────────────────────────────────────

interface ProjectFormModalProps {
  initial?: Project;
  isEdit?: boolean;
  onClose: () => void;
  onSave: (data: NewProjectFormData) => void;
}

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  initial,
  isEdit = false,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? '');
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [leaderId, setLeaderId] = useState(initial?.leaderId ?? PORTAL_USERS[0].id);
  const [memberIds, setMemberIds] = useState<string[]>(initial?.memberIds ?? [PORTAL_USERS[0].id]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const handleLeaderChange = (id: string) => {
    setLeaderId(id);
    if (!memberIds.includes(id)) setMemberIds((prev) => [...prev, id]);
  };

  const toggleMember = (userId: string) => {
    if (userId === leaderId) return;
    setMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Proje adı zorunlu.'); return; }
    if (!code.trim()) { setError('Proje kodu zorunlu.'); return; }
    const finalMembers = memberIds.includes(leaderId) ? memberIds : [...memberIds, leaderId];
    onSave({
      name: name.trim(),
      subtitle: subtitle.trim(),
      code: code.trim(),
      leaderId,
      memberIds: finalMembers,
      startDate: startDate.trim(),
      endDate: endDate.trim(),
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-lg mt-16 mb-8 overflow-hidden"
        >
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-text">
                {isEdit ? 'Projeyi Düzenle' : 'Yeni Proje Ekle'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="px-3 py-2 bg-red-bg text-red-text border border-red-border/30 rounded-lg text-[13px] font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <MField label="Proje Adı" required>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Örn: TÜBİTAK 1501"
                    className="w-full p-2.5 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-info-border transition-colors font-medium"
                  />
                </MField>
                <MField label="Proje Kodu" required>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Örn: 1501-XY23"
                    className="w-full p-2.5 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-info-border transition-colors font-mono"
                  />
                </MField>
              </div>

              <MField label="Alt Başlık">
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Örn: CALF-20 HSM Scale-up"
                  className="w-full p-2.5 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-info-border transition-colors"
                />
              </MField>

              <div className="grid grid-cols-2 gap-3">
                <MField label="Başlangıç">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-info-border transition-colors font-mono"
                  />
                </MField>
                <MField label="Bitiş">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-border rounded-lg text-[13px] outline-none focus:border-info-border transition-colors font-mono"
                  />
                </MField>
              </div>

              <MField label="Proje Lideri" required>
                <select
                  value={leaderId}
                  onChange={(e) => handleLeaderChange(e.target.value)}
                  className="w-full p-2.5 bg-white border border-border rounded-lg text-[14px] outline-none focus:border-info-border transition-colors appearance-none font-medium"
                  style={selectStyle}
                >
                  {PORTAL_USERS.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </MField>

              <MField label="Ekip Üyeleri">
                <div className="border border-border rounded-lg overflow-hidden">
                  {PORTAL_USERS.map((u, i) => {
                    const isLeader = u.id === leaderId;
                    const isChecked = memberIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors',
                          i < PORTAL_USERS.length - 1 && 'border-b border-border/40',
                          isChecked ? 'bg-info-bg/30' : 'hover:bg-surface-2/50',
                          isLeader && 'opacity-70 cursor-default'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleMember(u.id)}
                          disabled={isLeader}
                          className="w-3.5 h-3.5 accent-[#0C447C]"
                        />
                        <span
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-semibold shrink-0',
                            u.color
                          )}
                        >
                          {u.initials}
                        </span>
                        <span className="text-[13px] font-medium text-text flex-1">{u.name}</span>
                        {isLeader && (
                          <span className="text-[10.5px] font-semibold text-info-text">Lider</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </MField>
            </div>

            <div className="px-6 py-4 border-t border-border/40 bg-surface-2/30 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-border rounded-lg text-[13px] font-semibold text-text-2 hover:bg-surface-2 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0C447C] text-white rounded-lg text-[13px] font-semibold shadow-sm hover:bg-[#0a3a6e] transition-colors"
              >
                {isEdit ? 'Kaydet' : 'Oluştur'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const MField: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label, required, children,
}) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-semibold uppercase tracking-widest text-text-3">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

export default Projects;
