import React, { useState } from 'react';
import { getCachedUsers } from '../../../../lib/users';
import { useNavigation } from '../../../../lib/navigation';
import type { ModuleProps } from '../../../../types/portal';
import { LabBookProvider, useLabBook } from './context';
import { TopBar } from './components/TopBar';
import { TabNav } from './components/TabNav';
import { AnasayfaTab } from './components/tabs/AnasayfaTab';
import { MofUretimiTab } from './components/tabs/MofUretimiTab';
import { SekillendirmeTab } from './components/tabs/SekillendirmeTab';
import { LiteraturTab } from './components/tabs/LiteraturTab';
import { EgitimTab } from './components/tabs/EgitimTab';
import { exportAllPdf } from './pdfExport';

const LabBookInner: React.FC = () => {
  const { goHome } = useNavigation();
  const {
    activeTab, setActiveTab,
    search, setSearch,
    mof: { categories, experiments, materials, characterizations, variants, loading: mofLoading },
    literature: { items: literatureItems, loading: literatureLoading },
    training: { items: trainingItems, loading: trainingLoading },
  } = useLabBook();

  const [exporting, setExporting] = useState(false);

  const loading = mofLoading || literatureLoading || trainingLoading;

  const handleExport = async () => {
    setExporting(true);
    try {
      const users = getCachedUsers().map((u) => ({ id: u.id, name: u.name }));
      exportAllPdf({
        categories, experiments, materials, characterizations, variants,
        literature: literatureItems,
        trainings:  trainingItems,
        users,
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="helios-eln flex flex-col min-h-[calc(100vh-160px)]">
      {/* Breadcrumb */}
      <div className="px-8 pt-4 pb-2 text-[11px] font-medium text-[#6f6749]">
        <button onClick={goHome} className="hover:text-[#1F3D2E] transition-colors">
          ← Ana Sayfa
        </button>
      </div>

      <TopBar
        query={search}
        onQuery={setSearch}
        onExport={handleExport}
        exporting={exporting}
        showSearch={activeTab !== 'anasayfa'}
      />

      <TabNav active={activeTab} onChange={setActiveTab} />

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <span className="text-[13px] text-[#6f6749] italic">Yükleniyor…</span>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          {activeTab === 'anasayfa'      && <AnasayfaTab />}
          {activeTab === 'mof-uretimi'   && <MofUretimiTab />}
          {activeTab === 'sekillendirme' && <SekillendirmeTab />}
          {activeTab === 'literatur'     && <LiteraturTab />}
          {activeTab === 'egitim'        && <EgitimTab />}
        </div>
      )}
    </div>
  );
};

export const LabBook: React.FC<ModuleProps> = ({ user }) => (
  <LabBookProvider user={user}>
    <LabBookInner />
  </LabBookProvider>
);
