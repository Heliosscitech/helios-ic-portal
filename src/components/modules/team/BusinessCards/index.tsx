import React, { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { usePersistentState } from '../../../../lib/persistence';
import type { ModuleProps } from '../../../../types/portal';

import { ContactCard } from './components/ContactCard';
import { ContactModal } from './components/ContactModal';
import { INITIAL_CONTACTS } from './data';
import type { ContactInfo, ContactFormData } from './types';

const CONTACTS_KEY = 'helios:kartvizit:contacts';

const FILTER_TABS = [
  { id: 'all', label: 'Tümü' },
  { id: 'customer', label: 'Müşteri' },
  { id: 'investor', label: 'Yatırımcı' },
  { id: 'academic', label: 'Akademi' },
] as const;

export const BusinessCards: React.FC<ModuleProps> = () => {
  const [contacts, setContacts] = usePersistentState<ContactInfo[]>(CONTACTS_KEY, INITIAL_CONTACTS);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<string>('all');
  const [modalContact, setModalContact] = useState<ContactInfo | 'new' | null>(null);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q);
    const matchType = activeType === 'all' || c.type === activeType;
    return matchSearch && matchType;
  });

  const handleSave = (data: ContactFormData) => {
    if (modalContact === 'new') {
      const newContact: ContactInfo = {
        id: `contact-${Date.now().toString(36)}`,
        ...data,
      };

      setContacts((prev) => [...prev, newContact]);
    } else if (modalContact) {
      const id = modalContact.id;
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      );
    }
    setModalContact(null);
  };

  const handleDelete = () => {
    if (!modalContact || modalContact === 'new') return;
    const id = modalContact.id;
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setModalContact(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-8 md:p-10">
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-text tracking-tight mb-2">Kartvizit Rehberi</h2>
        <p className="text-text-3 text-[14px]">Dış paydaşlar ve kurumsal iletişim rehberi.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
          <input
            type="text"
            placeholder="İsim veya şirket ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border-[0.5px] border-border rounded-xl text-[14px] outline-none focus:border-info-border transition-all"
          />
        </div>
        <div className="flex gap-2 p-1 bg-surface-2 rounded-xl overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-[13px] font-bold whitespace-nowrap transition-all',
                activeType === tab.id ? 'bg-white shadow-sm text-[#0C447C]' : 'text-text-3 hover:text-text'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onClick={() => setModalContact(contact)}
          />
        ))}

        <button
          onClick={() => setModalContact('new')}
          className="border-[0.5px] border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-text-3 hover:bg-white hover:border-info-border hover:text-info-text transition-all group min-h-55"
        >
          <div className="w-12 h-12 rounded-full border border-dashed border-border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <UserPlus size={18} />
          </div>
          <span className="text-[13px] font-bold">Yeni Kart Ekle</span>
        </button>
      </div>

      <div className="text-center pt-12 opacity-50">
        <p className="text-[11px] text-text-3 font-bold uppercase tracking-widest">
          Helios Kurumsal Sistemler • 2026
        </p>
      </div>

      {modalContact !== null && (
        <ContactModal
          contact={modalContact === 'new' ? undefined : modalContact}
          onClose={() => setModalContact(null)}
          onSave={handleSave}
          onDelete={modalContact !== 'new' ? handleDelete : undefined}
        />
      )}
    </div>
  );
};

export default BusinessCards;
