import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { PORTAL_USERS } from '../../../../../types/users';

interface ProblemDetailFormProps {
  comment: string;
  assigneeId: string;
  onCommentChange: (val: string) => void;
  onAssigneeChange: (val: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export const ProblemDetailForm: React.FC<ProblemDetailFormProps> = ({
  comment,
  assigneeId,
  onCommentChange,
  onAssigneeChange,
  onCancel,
  onSave
}) => {
  return (
    <div className="py-6 space-y-6 border-b border-red-200/50 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 text-[12.5px] font-semibold text-red-700 uppercase tracking-wider">
        <AlertTriangle size={14} /> Sorun detayı
      </div>
      <textarea 
        autoFocus
        value={comment}
        onChange={e => onCommentChange(e.target.value)}
        className="w-full p-4 border border-red-200 rounded-xl text-[14px] outline-none focus:border-red-400 bg-white min-h-30 font-medium shadow-sm transition-all"
        placeholder="Yorum — ne oldu, ne yapıldı, ne gerekiyor..."
      />
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <select 
            value={assigneeId}
            onChange={e => onAssigneeChange(e.target.value)}
            className="w-full p-3 border border-red-200 rounded-xl text-[13px] outline-none bg-white font-semibold text-text-2 appearance-none shadow-sm cursor-pointer"
            style={{ 
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', 
              backgroundRepeat: 'no-repeat', 
              backgroundPosition: 'right 1rem center', 
              backgroundSize: '1rem' 
            }}
          >
            <option value="">Kişi atanmadı</option>
            {PORTAL_USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onCancel}
            className="px-6 py-2.5 bg-white border border-border rounded-xl text-[13px] font-semibold text-text hover:bg-surface-2 transition-all active:scale-95"
          >
            Vazgeç
          </button>
          <button 
            onClick={onSave}
            className="px-6 py-2.5 bg-[#1a1a19] text-white rounded-xl text-[13px] font-semibold shadow-lg hover:bg-black transition-all active:scale-95"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};
