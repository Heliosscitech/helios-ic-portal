import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import type { PersonPhase } from '../types';

interface TasksListProps {
  phases: PersonPhase[];
  onToggleTask: (phaseId: string, taskId: string) => void;
}

export const TasksList: React.FC<TasksListProps> = ({ phases, onToggleTask }) => {
  return (
    <div className="space-y-8">
      {phases.map((phase) => (
        <section key={phase.id} className="space-y-3">
          <h3 className="text-[12.5px] font-semibold text-[#8A4A1A] uppercase tracking-widest">
            {phase.title.toUpperCase()}
          </h3>
          <div className="divide-y divide-border/30">
            {phase.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-4 py-3 group"
              >
                <button
                  onClick={() => onToggleTask(phase.id, task.id)}
                  className={cn(
                    'mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors',
                    task.isDone
                      ? 'bg-[#BA7517] text-white'
                      : 'border border-border-strong text-transparent hover:border-[#BA7517]'
                  )}
                >
                  <Check size={13} strokeWidth={3.5} />
                </button>
                <div className="flex-1 min-w-0">
                  <h4
                    className={cn(
                      'text-[14px] font-semibold leading-tight',
                      task.isDone ? 'line-through text-text-3' : 'text-text'
                    )}
                  >
                    {task.title}
                  </h4>
                  <p className="text-[12.5px] text-text-3 mt-1 leading-relaxed">
                    {task.description}
                  </p>
                </div>
                <span className="text-[12.5px] text-[#8A4A1A] font-medium shrink-0 pt-0.5">
                  {task.assignee}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
