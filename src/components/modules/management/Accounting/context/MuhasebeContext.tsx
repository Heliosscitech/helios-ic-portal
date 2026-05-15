import React, { createContext, useContext, useState } from 'react';
import type { Project, MuhasebeRecord, LedgerEntry, ProjectFormData, LedgerFormData } from '../types';
import { MOCK_PROJECTS, MOCK_USD_RATE } from '../mockData';
import { genId } from '../utils';
import { toast } from '../../../../../lib/toast';

interface MuhasebeContextType {
  projects: Project[];
  usdRate: number;
  addProject: (data: ProjectFormData) => void;
  updateProject: (id: string, data: ProjectFormData) => void;
  deleteProject: (id: string) => void;
  addExpense: (projectId: string, data: Omit<MuhasebeRecord, 'id' | 'projeId' | 'createdAt'>) => void;
  updateExpense: (id: string, data: Omit<MuhasebeRecord, 'id' | 'projeId' | 'createdAt'>) => void;
  deleteExpense: (projectId: string, id: string) => void;
  bulkDeleteExpenses: (projectId: string, ids: Set<string>) => void;
  addLedgerEntry: (projectId: string, data: LedgerFormData) => void;
  updateLedgerEntry: (id: string, data: LedgerFormData) => void;
  deleteLedgerEntry: (projectId: string, id: string) => void;
  bulkDeleteLedgerEntries: (projectId: string, ids: Set<string>) => void;
}

const MuhasebeContext = createContext<MuhasebeContextType | undefined>(undefined);

export function MuhasebeProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const usdRate = MOCK_USD_RATE;

  const addProject = (data: ProjectFormData) => {
    const project: Project = {
      id: genId(),
      name: data.name,
      no: data.no,
      program: data.program,
      budget: data.budget,
      records: [],
      omRecords: [],
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [...prev, project]);
    toast.success('Proje oluşturuldu');
  };

  const updateProject = (id: string, data: ProjectFormData) => {
    setProjects(prev => prev.map(p =>
      p.id === id ? { ...p, name: data.name, no: data.no, program: data.program, budget: data.budget } : p
    ));
    toast.success('Proje güncellendi');
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    toast.success('Proje silindi');
  };

  const addExpense = (projectId: string, data: Omit<MuhasebeRecord, 'id' | 'projeId' | 'createdAt'>) => {
    const record: MuhasebeRecord = { ...data, id: genId(), projeId: projectId, createdAt: new Date().toISOString() };
    setProjects(prev => {
      const sourceProj = prev.find(p => p.id === projectId);
      return prev.map(p => {
        if (p.id === projectId) return { ...p, records: [...p.records, record] };
        if (p.isGenel && sourceProj && !sourceProj.isGenel) {
          const mirror: LedgerEntry = {
            id: genId(), projeId: p.id,
            tarih: data.tarih, tip: 'gider',
            aciklama: `${sourceProj.name} — ${data.malzemeAdi || data.aciklama || data.kategori}`,
            tutar: data.tutarKDVDahil, paraBirimi: data.paraBirimi,
            hesap: sourceProj.name, referansId: record.id,
            createdAt: new Date().toISOString(),
          };
          return { ...p, omRecords: [...p.omRecords, mirror] };
        }
        return p;
      });
    });
    toast.success('Harcama kaydedildi');
  };

  const updateExpense = (id: string, data: Omit<MuhasebeRecord, 'id' | 'projeId' | 'createdAt'>) => {
    setProjects(prev => {
      const sourceProj = prev.find(p => p.records.some(r => r.id === id));
      return prev.map(p => {
        if (p.records.some(r => r.id === id))
          return { ...p, records: p.records.map(r => r.id === id ? { ...r, ...data } : r) };
        if (p.isGenel && sourceProj && !sourceProj.isGenel)
          return {
            ...p,
            omRecords: p.omRecords.map(e =>
              e.referansId === id
                ? { ...e, tarih: data.tarih, aciklama: `${sourceProj.name} — ${data.malzemeAdi || data.aciklama || data.kategori}`, tutar: data.tutarKDVDahil, paraBirimi: data.paraBirimi }
                : e
            ),
          };
        return p;
      });
    });
    toast.success('Harcama güncellendi');
  };

  const deleteExpense = (projectId: string, id: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) return { ...p, records: p.records.filter(r => r.id !== id) };
      if (p.isGenel) return { ...p, omRecords: p.omRecords.filter(e => e.referansId !== id) };
      return p;
    }));
    toast.success('Harcama silindi');
  };

  const bulkDeleteExpenses = (projectId: string, ids: Set<string>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) return { ...p, records: p.records.filter(r => !ids.has(r.id)) };
      if (p.isGenel) return { ...p, omRecords: p.omRecords.filter(e => !e.referansId || !ids.has(e.referansId)) };
      return p;
    }));
    toast.success(`${ids.size} harcama silindi`);
  };

  const addLedgerEntry = (projectId: string, data: LedgerFormData) => {
    const entry: LedgerEntry = { ...data, id: genId(), projeId: projectId, createdAt: new Date().toISOString() };
    setProjects(prev => {
      const sourceProj = prev.find(p => p.id === projectId);
      return prev.map(p => {
        if (p.id === projectId) return { ...p, omRecords: [...p.omRecords, entry] };
        if (p.isGenel && sourceProj && !sourceProj.isGenel) {
          const mirror: LedgerEntry = {
            id: genId(), projeId: p.id,
            tarih: data.tarih, tip: data.tip,
            aciklama: `${sourceProj.name} — ${data.aciklama}`,
            tutar: data.tutar, paraBirimi: data.paraBirimi,
            hesap: sourceProj.name, referansId: entry.id,
            createdAt: new Date().toISOString(),
          };
          return { ...p, omRecords: [...p.omRecords, mirror] };
        }
        return p;
      });
    });
    toast.success('Kayıt eklendi');
  };

  const updateLedgerEntry = (id: string, data: LedgerFormData) => {
    setProjects(prev => {
      const sourceProj = prev.find(p => p.omRecords.some(e => e.id === id));
      return prev.map(p => {
        if (p.omRecords.some(e => e.id === id))
          return { ...p, omRecords: p.omRecords.map(e => e.id === id ? { ...e, ...data } : e) };
        if (p.isGenel && sourceProj && !sourceProj.isGenel)
          return {
            ...p,
            omRecords: p.omRecords.map(e =>
              e.referansId === id
                ? { ...e, tarih: data.tarih, tip: data.tip, aciklama: `${sourceProj.name} — ${data.aciklama}`, tutar: data.tutar, paraBirimi: data.paraBirimi }
                : e
            ),
          };
        return p;
      });
    });
    toast.success('Kayıt güncellendi');
  };

  const deleteLedgerEntry = (projectId: string, id: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) return { ...p, omRecords: p.omRecords.filter(e => e.id !== id) };
      if (p.isGenel) return { ...p, omRecords: p.omRecords.filter(e => e.referansId !== id) };
      return p;
    }));
    toast.success('Kayıt silindi');
  };

  const bulkDeleteLedgerEntries = (projectId: string, ids: Set<string>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) return { ...p, omRecords: p.omRecords.filter(e => !ids.has(e.id)) };
      if (p.isGenel) return { ...p, omRecords: p.omRecords.filter(e => !e.referansId || !ids.has(e.referansId)) };
      return p;
    }));
    toast.success(`${ids.size} kayıt silindi`);
  };

  return (
    <MuhasebeContext.Provider value={{
      projects, usdRate,
      addProject, updateProject, deleteProject,
      addExpense, updateExpense, deleteExpense, bulkDeleteExpenses,
      addLedgerEntry, updateLedgerEntry, deleteLedgerEntry, bulkDeleteLedgerEntries,
    }}>
      {children}
    </MuhasebeContext.Provider>
  );
}

export function useMuhasebe() {
  const ctx = useContext(MuhasebeContext);
  if (!ctx) throw new Error('useMuhasebe must be used within MuhasebeProvider');
  return ctx;
}
