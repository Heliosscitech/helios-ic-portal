import React, { useState } from 'react';
import { MuhasebeProvider } from './context/MuhasebeContext';
import { ProjeListesi } from './views/ProjeListesi';
import { Dashboard } from './views/Dashboard';
import type { NavState, ProjectTab } from './types';

const AccountingInner: React.FC = () => {
  const [nav, setNav] = useState<NavState>({ screen: 'list' });

  const goToProject = (projectId: string, tab: ProjectTab = 'ozet') => {
    setNav({ screen: 'detail', projectId, tab });
  };

  const goBack = () => setNav({ screen: 'list' });

  if (nav.screen === 'detail') {
    return (
      <Dashboard
        projectId={nav.projectId}
        tab={nav.tab}
        onTabChange={(tab) => setNav({ screen: 'detail', projectId: nav.projectId, tab })}
        onBack={goBack}
      />
    );
  }

  return <ProjeListesi onSelectProject={goToProject} />;
};

export const Accounting: React.FC = () => (
  <MuhasebeProvider>
    <AccountingInner />
  </MuhasebeProvider>
);
