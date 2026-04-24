import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, GripVertical, Trash2 } from 'lucide-react';
import type { OnboardingTemplate, PhaseTemplate, TaskTemplate } from '../types';

interface EditTemplateModalProps {
  template: OnboardingTemplate;
  onClose: () => void;
  onSave: (next: OnboardingTemplate) => void;
}

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const emptyTask = (): TaskTemplate => ({
  id: newId('tpl'),
  title: '',
  description: '',
  assignee: '',
});

const emptyPhase = (): PhaseTemplate => ({
  id: newId('phase'),
  title: 'Yeni faz',
  tasks: [emptyTask()],
});

export const EditTemplateModal: React.FC<EditTemplateModalProps> = ({
  template,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState<OnboardingTemplate>(() => structuredClone(template));

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const updatePhaseTitle = (phaseId: string, title: string) => {
    setDraft((prev) => prev.map((p) => (p.id === phaseId ? { ...p, title } : p)));
  };

  const updateTask = (phaseId: string, taskId: string, patch: Partial<TaskTemplate>) => {
    setDraft((prev) =>
      prev.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
            }
          : p
      )
    );
  };

  const addTask = (phaseId: string) => {
    setDraft((prev) =>
      prev.map((p) => (p.id === phaseId ? { ...p, tasks: [...p.tasks, emptyTask()] } : p))
    );
  };

  const removeTask = (phaseId: string, taskId: string) => {
    setDraft((prev) =>
      prev.map((p) =>
        p.id === phaseId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p
      )
    );
  };

  const addPhase = () => {
    setDraft((prev) => [...prev, emptyPhase()]);
  };

  const removePhase = (phaseId: string) => {
    if (!window.confirm('Bu fazı ve içindeki tüm görevleri silmek istiyor musun?')) return;
    setDraft((prev) => prev.filter((p) => p.id !== phaseId));
  };

  const handleSave = () => {
    // Boş task'ları budayarak kaydet (başlığı boş olan task yok sayılır)
    const cleaned = draft
      .map((p) => ({
        ...p,
        title: p.title.trim() || 'İsimsiz faz',
        tasks: p.tasks
          .filter((t) => t.title.trim() !== '')
          .map((t) => ({
            ...t,
            title: t.title.trim(),
            description: t.description.trim(),
            assignee: t.assignee.trim(),
          })),
      }))
      .filter((p) => p.tasks.length > 0 || draft.length === 1);
    onSave(cleaned);
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
          className="bg-[#F7F3EA] rounded-2xl shadow-2xl border border-border w-full max-w-[800px] mt-10 mb-10 overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-white">
            <h3 className="text-[15px] font-bold text-text">Onboarding şablonu</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-text-3 hover:text-text hover:bg-surface-2 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {draft.map((phase) => (
              <div
                key={phase.id}
                className="bg-white border border-border/40 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <input
                    value={phase.title}
                    onChange={(e) => updatePhaseTitle(phase.id, e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-border/60 rounded-lg text-[13px] font-bold outline-none focus:border-text transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => removePhase(phase.id)}
                    title="Fazı sil"
                    className="p-2 text-text-3 hover:text-red-text hover:bg-red-bg rounded-lg transition-colors"
                  >
                    <GripVertical size={14} />
                  </button>
                </div>

                <div className="space-y-2">
                  {phase.tasks.map((task) => (
                    <div key={task.id} className="grid grid-cols-[1fr_1.5fr_120px_32px] gap-2 items-center">
                      <input
                        value={task.title}
                        onChange={(e) => updateTask(phase.id, task.id, { title: e.target.value })}
                        placeholder="Başlık"
                        className="p-2 bg-white border border-border/40 rounded-lg text-[12px] outline-none focus:border-text transition-colors"
                      />
                      <input
                        value={task.description}
                        onChange={(e) =>
                          updateTask(phase.id, task.id, { description: e.target.value })
                        }
                        placeholder="Açıklama"
                        className="p-2 bg-white border border-border/40 rounded-lg text-[12px] outline-none focus:border-text transition-colors"
                      />
                      <input
                        value={task.assignee}
                        onChange={(e) =>
                          updateTask(phase.id, task.id, { assignee: e.target.value })
                        }
                        placeholder="Atanan"
                        className="p-2 bg-white border border-border/40 rounded-lg text-[12px] outline-none focus:border-text transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => removeTask(phase.id, task.id)}
                        title="Görevi sil"
                        className="p-1.5 text-text-3 hover:text-red-text hover:bg-red-bg rounded-lg transition-colors flex items-center justify-center"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addTask(phase.id)}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 border border-border/40 rounded-lg text-[12px] font-medium text-text-2 hover:bg-surface-2 transition-colors"
                >
                  <Plus size={12} /> Bu faza görev ekle
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addPhase}
              className="w-full py-3 border-2 border-dashed border-border rounded-2xl text-[13px] font-medium text-text-3 hover:text-text hover:border-border-strong hover:bg-white/50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={14} /> Yeni faz ekle
            </button>
          </div>

          <div className="px-6 py-4 border-t border-border/40 bg-white flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 bg-[#BA7517] text-white rounded-lg text-[13px] font-bold shadow-sm hover:bg-[#a46515] transition-colors"
            >
              Tamam
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
