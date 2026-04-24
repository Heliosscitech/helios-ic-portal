import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { ProblemDetailForm } from './ProblemDetailForm';

interface ChecklistItem {
  id: string;
  name: string;
  instruction: string;
  isCustom?: boolean;
}

interface ItemStatus {
  type: 'ok' | 'problem' | null;
  comment?: string;
  assigneeId?: string;
  timestamp?: string;
  userInitials?: string;
  userName?: string;
}

interface ChecklistTableProps {
  items: ChecklistItem[];
  statusMap: Record<string, ItemStatus>;
  editingProblemId: string | null;
  problemData: { comment: string; assigneeId: string };
  onToggle: (id: string, type: 'ok' | 'problem') => void;
  onProblemDataChange: (data: { comment: string; assigneeId: string }) => void;
  onSaveProblem: () => void;
  onCancelProblem: () => void;
}

export const ChecklistTable: React.FC<ChecklistTableProps> = ({
  items,
  statusMap,
  editingProblemId,
  problemData,
  onToggle,
  onProblemDataChange,
  onSaveProblem,
  onCancelProblem
}) => {
  return (
    <div className="border border-border/40 rounded-2xl overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse font-sans">
        <thead>
          <tr className="bg-[#f1efe8]/50 border-b border-border/30">
            <th className="px-8 py-4 text-[12.5px] font-semibold text-text-3 uppercase tracking-widest">Ekipman</th>
            <th className="px-8 py-4 text-[12.5px] font-semibold text-text-3 uppercase tracking-widest text-center">Durum</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const status = statusMap[item.id];
            const isOk = status?.type === 'ok';
            const isProblem = status?.type === 'problem';
            const isEditing = editingProblemId === item.id;

            return (
              <React.Fragment key={item.id}>
                <tr className={cn(
                  "border-b border-border/10 transition-all duration-300 group",
                  isOk && "bg-teal-50/40",
                  isProblem && "bg-red-50/60"
                )}>
                  <td className="px-8 py-6">
                    <p className="text-[14px] font-semibold text-text mb-0.5">
                      {item.name}
                      {item.isCustom && <span className="ml-2 text-[10.5px] bg-surface-2 px-1.5 py-0.5 rounded text-text-3 font-semibold uppercase tracking-tighter">Yeni</span>}
                    </p>
                    <p className="text-[12.5px] text-text-3 italic font-medium opacity-70">{item.instruction}</p>
                  </td>
                  <td className="px-8 py-6 w-48">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center bg-surface-2 p-1 rounded-full border border-border/10 shadow-inner">
                        <button 
                          onClick={() => onToggle(item.id, 'ok')} 
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300", 
                            isOk 
                              ? "bg-teal-500 text-white shadow-lg transform scale-110" 
                              : "text-text-3 hover:text-teal-600 hover:bg-white"
                          )}
                        >
                          <Check size={16} strokeWidth={3} />
                        </button>
                        <button 
                          onClick={() => onToggle(item.id, 'problem')} 
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300", 
                            isProblem 
                              ? "bg-red-500 text-white shadow-lg transform scale-110" 
                              : "text-text-3 hover:text-red-600 hover:bg-white"
                          )}
                        >
                          <X size={16} strokeWidth={3} />
                        </button>
                      </div>
                      {isProblem && status.userInitials && (
                        <div className="flex items-center gap-1.5 text-[10.5px] text-text-3 font-semibold animate-in fade-in zoom-in duration-300 whitespace-nowrap">
                          <span className="w-5 h-5 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-[8px] font-semibold shadow-sm ring-1 ring-red-200">{status.userInitials}</span>
                          <span className="text-red-700/80">{status.userName} — {status.timestamp}</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                {isEditing && (
                  <tr>
                    <td colSpan={2} className="px-8 py-0 bg-red-50/30">
                      <ProblemDetailForm 
                        comment={problemData.comment}
                        assigneeId={problemData.assigneeId}
                        onCommentChange={(val) => onProblemDataChange({ ...problemData, comment: val })}
                        onAssigneeChange={(val) => onProblemDataChange({ ...problemData, assigneeId: val })}
                        onCancel={onCancelProblem}
                        onSave={onSaveProblem}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
