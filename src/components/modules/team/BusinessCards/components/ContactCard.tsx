import React from 'react';
import { Mail, Phone, Building2, Tag, MapPin } from 'lucide-react';
import { cn } from '../../../../../lib/utils';
import { formatTRCompact } from '../../../../../lib/dates';
import type { ContactInfo } from '../types';

interface ContactCardProps {
  contact: ContactInfo;
  onClick: () => void;
}

const TYPE_LABEL: Record<ContactInfo['type'], string> = {
  customer: 'Müşteri',
  investor: 'Yatırımcı',
  academic: 'Akademi',
  supplier: 'Tedarikçi',
  other: 'Diğer',
};

const getTypeStyles = (type: ContactInfo['type']) => {
  switch (type) {
    case 'customer': return 'bg-teal-bg text-teal-text border-teal-border/30';
    case 'investor': return 'bg-purple-bg text-purple-text border-purple-border/30';
    case 'academic': return 'bg-info-bg text-info-text border-info-border/30';
    case 'supplier': return 'bg-amber-bg text-amber-text border-amber-border/30';
    default: return 'bg-surface-2 text-text-3 border-border';
  }
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);

export const ContactCard: React.FC<ContactCardProps> = ({ contact, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white border-[0.5px] border-border rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-3">
        <div className={cn('px-2 py-0.5 rounded text-[10.5px] font-semibold uppercase tracking-wider border', getTypeStyles(contact.type))}>
          {TYPE_LABEL[contact.type]}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-linear-to-br from-[#E8F0F7] to-[#c8d8e8] flex items-center justify-center text-[14px] font-semibold text-[#2E5A7C] shrink-0">
          {getInitials(contact.name)}
        </div>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-text group-hover:text-[#0C447C] transition-colors">{contact.name}</h3>
          <p className="text-[12.5px] text-text-3 font-medium">{contact.title}</p>
          {contact.company && (
            <p className="text-[12.5px] text-[#0C447C] font-semibold mt-0.5 flex items-center gap-1 truncate">
              <Building2 size={12} className="shrink-0" /> {contact.company}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2.5 pt-4 border-t border-dashed border-border">
        {contact.email ? (
          <span
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-3 text-[12.5px] text-text-2 hover:text-[#0C447C] transition-colors"
          >
            <Mail size={14} className="text-text-3 shrink-0" />
            <a href={`mailto:${contact.email}`} className="truncate">{contact.email}</a>
          </span>
        ) : (
          <span className="flex items-center gap-3 text-[12.5px] text-text-3">
            <Mail size={14} className="shrink-0" /> —
          </span>
        )}
        {contact.phone ? (
          <span
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-3 text-[12.5px] text-text-2 font-mono"
          >
            <Phone size={14} className="text-text-3 shrink-0" />
            <a href={`tel:${contact.phone}`}>{contact.phone}</a>
          </span>
        ) : (
          <span className="flex items-center gap-3 text-[12.5px] text-text-3 font-mono">
            <Phone size={14} className="shrink-0" /> —
          </span>
        )}
      </div>

      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {contact.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10.5px] bg-surface-2 text-text-3 px-2 py-1 rounded-md font-semibold flex items-center gap-1"
            >
              <Tag size={8} /> {tag}
            </span>
          ))}
        </div>
      )}

      {(contact.neredeTanistiniz || contact.tarih) && (
        <p className="mt-3 text-[11px] text-text-3 flex items-center gap-1.5">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">
            {contact.neredeTanistiniz}
            {contact.neredeTanistiniz && contact.tarih && ' · '}
            {contact.tarih && formatTRCompact(contact.tarih)}
          </span>
        </p>
      )}
    </div>
  );
};
