import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import type { ModuleProps } from '../../../../types/portal';
import { isHr } from '../../../../types/users';
import { usePortalUsers } from '../../../../lib/users';
import { useNotifications } from '../../../../lib/notifications';
import { BreadcrumbHome } from '../../../BreadcrumbHome';
import { confirmAction } from '../../../../lib/confirm';

import { PeopleSidebar } from './components/PeopleSidebar';
import { PersonHeader } from './components/PersonHeader';
import { TasksList } from './components/TasksList';
import { EditPersonModal } from './components/EditPersonModal';
import type { PersonModalMode, PersonFormData } from './components/EditPersonModal';
import { EditTemplateModal } from './components/EditTemplateModal';

import { useOnboardingPeople, useOnboardingTemplate } from './hooks';
import type { OnboardingPerson, OnboardingTemplate } from './types';

export const Onboarding: React.FC<ModuleProps> = ({ user }) => {
  const { template, saveTemplate } = useOnboardingTemplate();
  const { people, addPerson, updatePerson, deletePerson, toggleTask, resyncFromTemplate } = useOnboardingPeople();
  const { users } = usePortalUsers();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [personModal, setPersonModal] = useState<PersonModalMode | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const { dispatch } = useNotifications();

  const canManage = isHr(user.id);

  // Kullanıcının görebileceği kayıtlar: HR herkesi, diğerleri sadece kendilerine bağlı olanları
  const visiblePeople = useMemo<OnboardingPerson[]>(() => {
    if (canManage) return people;
    return people.filter((p) => p.ownerId === user.id);
  }, [people, canManage, user.id]);

  // Seçili kişiyi güncel görünür listeye göre belirle
  const selected: OnboardingPerson | undefined = useMemo(() => {
    if (!visiblePeople.length) return undefined;
    return visiblePeople.find((p) => p.id === selectedId) ?? visiblePeople[0];
  }, [visiblePeople, selectedId]);

  // İlk yüklemede / görünür liste değiştikçe seçimi düzelt
  useEffect(() => {
    if (selected && selected.id !== selectedId) {
      setSelectedId(selected.id);
    } else if (!selected && selectedId !== null) {
      setSelectedId(null);
    }
  }, [selected, selectedId]);

  const handleToggleTask = (_phaseId: string, taskId: string) => {
    if (!selected) return;
    const target = selected.phases.flatMap((p) => p.tasks).find((t) => t.id === taskId);
    if (!target) return;
    toggleTask(taskId, target.isDone);

    // Görev "yapılmadı → yapıldı" geçişinde, görev atanan kişiye bildirim
    const becomingDone = !target.isDone;
    if (becomingDone && target.assignee) {
      const assigneeUser = users.find((u) => u.name === target.assignee);
      if (assigneeUser && assigneeUser.id !== user.id) {
        dispatch({
          type: 'onboarding-task-done',
          source: 'onboarding',
          entityId: selected.id,
          entityTitle: selected.name,
          actorId: user.id,
          targetUserIds: [assigneeUser.id],
          message: `"${selected.name}" onboarding'inde sana atanan görevi tamamladı: "${target.title}"`,
        });
      }
    }
  };

  const handleSavePerson = async (data: PersonFormData) => {
    if (personModal === 'edit' && selected) {
      await updatePerson(selected.id, {
        name: data.name,
        role: data.role,
        startDate: data.startDate,
        ownerLegacyId: data.ownerId ?? undefined,
      });
    } else if (personModal === 'add') {
      const created = await addPerson(
        {
          name: data.name,
          role: data.role,
          startDate: data.startDate,
          ownerLegacyId: data.ownerId ?? undefined,
        },
        template
      );

      if (created && created.ownerId && created.ownerId !== user.id) {
        dispatch({
          type: 'onboarding-person-added',
          source: 'onboarding',
          entityId: created.id,
          entityTitle: created.name,
          actorId: user.id,
          targetUserIds: [created.ownerId],
          message: `senin için yeni bir onboarding kaydı oluşturdu: "${created.name}" (${created.role})`,
        });
      }

      if (created) setSelectedId(created.id);
    }
    setPersonModal(null);
  };

  const handleDeletePerson = async () => {
    if (!selected) return;
    const ok = await confirmAction({
      title: 'Onboarding kaydını sil?',
      message: `"${selected.name}" kaydı kalıcı olarak silinecek.`,
      confirmText: 'Sil',
      variant: 'danger',
    });
    if (!ok) return;
    const idx = people.findIndex((p) => p.id === selected.id);
    await deletePerson(selected.id);
    const nextList = people.filter((p) => p.id !== selected.id);
    const fallback = nextList[idx] ?? nextList[idx - 1] ?? null;
    setSelectedId(fallback ? fallback.id : null);
  };

  const handleSaveTemplate = async (next: OnboardingTemplate) => {
    await saveTemplate(next);
    setTemplateModalOpen(false);
  };

  const handleResync = async () => {
    if (!selected) return;
    const ok = await confirmAction({
      title: 'Görevleri yeniden oluştur?',
      message: `"${selected.name}" görevleri şablonun güncel halinden yeniden oluşturulacak. Tamamlandı işaretleri kaybolacak.`,
      confirmText: 'Devam et',
    });
    if (!ok) return;
    await resyncFromTemplate(selected.id);
  };

  // Boş durumlar
  const showEmptyState = !selected;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white px-6 py-3 border border-border/40 rounded-xl flex items-center gap-2 text-[13px] text-text-3 font-medium">
        <BreadcrumbHome />
        <span>/</span>
        <span className="text-text font-semibold">Onboarding</span>
      </div>

      <div className="flex items-start gap-6">
        <PeopleSidebar
          people={visiblePeople}
          selectedId={selected?.id ?? null}
          canAddPerson={canManage}
          onSelect={setSelectedId}
          onAddPerson={() => setPersonModal('add')}
        />

        {!showEmptyState && selected ? (
          <div className="flex-1 bg-white border border-border/40 rounded-2xl p-8 shadow-sm space-y-6 min-w-0">
            <PersonHeader
              person={selected}
              canEdit={canManage}
              onEdit={() => setPersonModal('edit')}
              onDelete={handleDeletePerson}
              onResync={canManage ? handleResync : undefined}
            />

            {canManage ? (
              <div className="bg-amber-bg/40 border border-amber-border/30 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle size={16} className="text-amber-text shrink-0" />
                <p className="flex-1 text-[13px] text-amber-text">
                  Aşağıdaki şablon tüm yeni kişilere otomatik atanır. Faz/görev eklemek veya silmek için sağdaki butonu kullan.
                </p>
                <button
                  onClick={() => setTemplateModalOpen(true)}
                  className="px-4 py-2 bg-[#BA7517] text-white rounded-lg text-[12.5px] font-semibold shadow-sm hover:bg-[#a46515] transition-colors whitespace-nowrap"
                >
                  Şablonu düzenle
                </button>
              </div>
            ) : (
              <div className="bg-teal-bg/40 border border-teal-border/30 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle size={16} className="text-teal-text shrink-0" />
                <p className="flex-1 text-[13px] text-teal-text">
                  Hoş geldin! Aşağıdaki görevleri tamamladıkça üstteki ilerlemen anlık güncellenir.
                  Sorularını buddy'ne veya atanmış kişilere yöneltebilirsin.
                </p>
              </div>
            )}

            <TasksList phases={selected.phases} onToggleTask={handleToggleTask} />

            <div className="text-center pt-8 opacity-50">
              <p className="text-[11px] text-text-3 font-semibold uppercase tracking-widest">
                Prototip görünüm · Veriler tarayıcıda kalıcı tutulur · © Helios Bilim ve Teknoloji A.Ş.
              </p>
            </div>
          </div>
        ) : (
          <EmptyState canManage={canManage} onAddPerson={() => setPersonModal('add')} />
        )}
      </div>

      {personModal && (
        <EditPersonModal
          mode={personModal}
          person={personModal === 'edit' ? selected : undefined}
          onClose={() => setPersonModal(null)}
          onSave={handleSavePerson}
        />
      )}

      {templateModalOpen && canManage && (
        <EditTemplateModal
          template={template}
          onClose={() => setTemplateModalOpen(false)}
          onSave={handleSaveTemplate}
        />
      )}
    </div>
  );
};

interface EmptyStateProps {
  canManage: boolean;
  onAddPerson: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ canManage, onAddPerson }) => {
  if (canManage) {
    return (
      <div className="flex-1 bg-white border border-border/40 rounded-2xl p-20 shadow-sm flex flex-col items-center justify-center text-center min-w-0">
        <div className="w-16 h-16 rounded-full bg-[#F7ECE4] text-[#8A4A1A] flex items-center justify-center mb-4">
          <AlertCircle size={28} />
        </div>
        <h3 className="text-[15px] font-semibold text-text mb-1">Henüz onboarding kaydı yok</h3>
        <p className="text-[13px] text-text-3 mb-6 max-w-sm">
          Sol panelden yeni bir kişi ekleyerek onboarding sürecini başlatabilirsiniz.
        </p>
        <button
          onClick={onAddPerson}
          className="px-5 py-2 bg-[#BA7517] text-white rounded-lg text-[13px] font-semibold shadow-sm hover:bg-[#a46515] transition-colors"
        >
          Yeni kişi ekle
        </button>
      </div>
    );
  }

  // Non-HR kullanıcı ve kendi onboarding'i yok
  return (
    <div className="flex-1 bg-white border border-border/40 rounded-2xl p-20 shadow-sm flex flex-col items-center justify-center text-center min-w-0">
      <div className="w-16 h-16 rounded-full bg-surface-2 text-text-3 flex items-center justify-center mb-4">
        <Lock size={24} />
      </div>
      <h3 className="text-[15px] font-semibold text-text mb-1">Senin için bir onboarding kaydı yok</h3>
      <p className="text-[13px] text-text-3 max-w-sm leading-relaxed">
        Bu modül kişiseldir — başkalarının onboarding süreçlerini göremezsin.
        Kaydın açıldığında burada görünecek. Sorular için İK ile iletişime geç.
      </p>
    </div>
  );
};

export default Onboarding;
