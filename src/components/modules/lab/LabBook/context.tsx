import React, { createContext, useContext, useMemo, useState } from 'react';
import type { User } from '../../../../types/portal';
import type { LabTabId } from './types';
import { useMofData, useLabLiterature, useLabTrainings } from './hooks';

interface LabBookContextValue {
  user:        User;

  /** Aktif tab + tab geçişi */
  activeTab:   LabTabId;
  setActiveTab: (id: LabTabId) => void;

  /** TopBar arama metni (global filtre) */
  search:      string;
  setSearch:   (q: string) => void;

  /** Tab-özel seçim state'leri (cross-tab navigation için) */
  mofTabSelectedCategoryId:        string | null;
  setMofTabSelectedCategoryId:     (id: string | null) => void;
  mofTabSelectedExperimentId:      string | null;
  setMofTabSelectedExperimentId:   (id: string | null) => void;
  shapingSelectedMofId:            string | null;
  setShapingSelectedMofId:         (id: string | null) => void;
  shapingSelectedExperimentId:     string | null;
  setShapingSelectedExperimentId:  (id: string | null) => void;
  literatureSelectedId:            string | null;
  setLiteratureSelectedId:         (id: string | null) => void;
  trainingSelectedId:              string | null;
  setTrainingSelectedId:           (id: string | null) => void;

  /** Veri hook'ları */
  mof:        ReturnType<typeof useMofData>;
  literature: ReturnType<typeof useLabLiterature>;
  training:   ReturnType<typeof useLabTrainings>;
}

const LabBookContext = createContext<LabBookContextValue | null>(null);

export const useLabBook = (): LabBookContextValue => {
  const ctx = useContext(LabBookContext);
  if (!ctx) throw new Error('useLabBook must be used inside <LabBookProvider>');
  return ctx;
};

interface LabBookProviderProps {
  user:     User;
  children: React.ReactNode;
}

export const LabBookProvider: React.FC<LabBookProviderProps> = ({ user, children }) => {
  const [activeTab, setActiveTab] = useState<LabTabId>('anasayfa');
  const [search, setSearch] = useState('');

  const [mofTabSelectedCategoryId, setMofTabSelectedCategoryId] = useState<string | null>(null);
  const [mofTabSelectedExperimentId, setMofTabSelectedExperimentId] = useState<string | null>(null);
  const [shapingSelectedMofId, setShapingSelectedMofId] = useState<string | null>(null);
  const [shapingSelectedExperimentId, setShapingSelectedExperimentId] = useState<string | null>(null);
  const [literatureSelectedId, setLiteratureSelectedId] = useState<string | null>(null);
  const [trainingSelectedId, setTrainingSelectedId] = useState<string | null>(null);

  const mof = useMofData();
  const literature = useLabLiterature();
  const training = useLabTrainings();

  const value = useMemo<LabBookContextValue>(() => ({
    user, activeTab, setActiveTab, search, setSearch,
    mofTabSelectedCategoryId, setMofTabSelectedCategoryId,
    mofTabSelectedExperimentId, setMofTabSelectedExperimentId,
    shapingSelectedMofId, setShapingSelectedMofId,
    shapingSelectedExperimentId, setShapingSelectedExperimentId,
    literatureSelectedId, setLiteratureSelectedId,
    trainingSelectedId, setTrainingSelectedId,
    mof, literature, training,
  }), [
    user, activeTab, search,
    mofTabSelectedCategoryId, mofTabSelectedExperimentId,
    shapingSelectedMofId, shapingSelectedExperimentId,
    literatureSelectedId, trainingSelectedId,
    mof, literature, training,
  ]);

  return <LabBookContext.Provider value={value}>{children}</LabBookContext.Provider>;
};
