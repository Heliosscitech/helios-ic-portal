import React from 'react';
import { Clock, MessageSquare } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { formatTRCompact, isToday } from '../../../../../lib/dates';
import { PORTAL_USERS } from '../../../../../types/users';
import { UNITS, columnTitle } from '../types';
import type { BoardColumn, BoardTask } from '../types';

interface ListViewProps {
  tasks: BoardTask[];
  columns: BoardColumn[];
  onTaskClick: (id: string) => void;
}

const PRIORITY_STYLE: Record<BoardTask['priority'], string> = {
  low: 'text-text-3',
  medium: 'text-amber-text',
  high: 'text-red-text',
};

const getUnit = (id: string) => UNITS.find((u) => u.id === id);
const getUser = (id: string) => PORTAL_USERS.find((u) => u.id === id);

export const ListView: React.FC<ListViewProps> = ({ tasks, columns, onTaskClick }) => {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="bg-white border border-border/40 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-2/50 border-b border-border/40">
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-text-3">
                İş
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-text-3">
                Birim
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-text-3">
                Durum
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-text-3">
                Öncelik
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-text-3">
                Atananlar
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-text-3">
                Tarih
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-text-3 text-center">
                💬
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const unit = getUnit(task.unitId);
              return (
                <tr
                  key={task.id}
                  onClick={() => onTaskClick(task.id)}
                  className="border-b border-border/20 hover:bg-surface-2/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[10.5px] font-mono font-semibold text-text-3 bg-surface-2 px-1.5 py-0.5 rounded">
                        {task.id}
                      </span>
                      <span className="text-[13px] font-semibold text-text">{task.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', unit?.dotColor)} />
                      <span className="text-[12.5px] text-text-2 font-medium">{unit?.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-2 text-text-2 text-[10.5px] font-semibold uppercase tracking-wider">
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          columns.find((c) => c.id === task.status)?.dot ?? 'bg-text-3'
                        )}
                      />
                      {columnTitle(columns, task.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'text-[12.5px] font-semibold capitalize',
                        PRIORITY_STYLE[task.priority]
                      )}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex -space-x-2">
                      {task.assigneeIds.slice(0, 3).map((uid) => {
                        const u = getUser(uid);
                        return (
                          <div
                            key={uid}
                            title={u?.name}
                            className={cn(
                              'w-6 h-6 rounded-full border-2 border-white text-[10.5px] font-semibold flex items-center justify-center',
                              u?.color
                            )}
                          >
                            {u?.initials}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className={cn(
                        'flex items-center gap-1 text-[12.5px] font-mono',
                        isToday(task.dueDate) ? 'text-red-border font-semibold' : 'text-text-2'
                      )}
                    >
                      <Clock size={12} /> {isToday(task.dueDate) ? 'Bugün' : formatTRCompact(task.dueDate)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {task.comments > 0 ? (
                      <div className="inline-flex items-center gap-1 text-[12.5px] text-text-3">
                        <MessageSquare size={12} /> {task.comments}
                      </div>
                    ) : (
                      <span className="text-text-3 opacity-30">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-20 text-center text-[13px] text-text-3 italic">
                  Filtreye uyan iş bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
