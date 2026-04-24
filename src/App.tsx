import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Login } from './components/Login';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './components/Dashboard';

// Team
import { Takvim } from './components/modules/team/Takvim';
import { Board } from './components/modules/team/Board';
import { BusinessCards } from './components/modules/team/BusinessCards/index';

// Lab
import { LabChecklist } from './components/modules/lab/LabChecklist';
import { LabBook } from './components/modules/lab/LabBook';
import { LabStock } from './components/modules/lab/LabStock';
import { SOP } from './components/modules/lab/SOP';
import { ResearchPlan } from './components/modules/lab/ResearchPlan';

// HR
import { LeaveForm } from './components/modules/hr/LeaveForm';
import { Onboarding } from './components/modules/hr/Onboarding';

// Management & Finance
import { Purchasing } from './components/modules/management/Purchasing';
import { Projects } from './components/modules/management/Projects/index';
import { Press } from './components/modules/management/Press/index';
import { Accounting } from './components/modules/management/Accounting';
import { Sales } from './components/modules/management/Sales';
import { Runway } from './components/modules/management/Runway';
import { Distributors } from './components/modules/management/Distributors';
import { UserManagement } from './components/modules/management/UserManagement/index';

import type { ModuleId, User } from './types/portal';
import { PORTAL_USERS } from './types/users';
import { usePortalUsers } from './lib/users';
import { ArrowLeft } from 'lucide-react';
import { NotificationsProvider } from './lib/notifications';

function App() {
  const { users } = usePortalUsers();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(PORTAL_USERS[0]);
  const [currentModule, setCurrentModule] = useState<ModuleId>('pano');

  const handleLogin = (selected: User) => {
    // Grab the freshest version from persisted users list
    const fresh = users.find((u) => u.id === selected.id) ?? selected;
    setCurrentUser(fresh);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentModule('pano');
  };

  const canAccess = (module: ModuleId): boolean => {
    if (module === 'pano') return true;
    if (currentUser.userRole === 'yonetici') return true;
    return currentUser.allowedModules.includes(module);
  };

  const renderModule = () => {
    if (!canAccess(currentModule)) {
      return <Dashboard onModuleSelect={setCurrentModule} currentUser={currentUser} />;
    }

    switch (currentModule) {
      case 'pano':
        return <Dashboard onModuleSelect={setCurrentModule} currentUser={currentUser} />;
      case 'takvim':
        return <Takvim user={currentUser} />;
      case 'lab-checklist':
        return <LabChecklist user={currentUser} />;
      case 'izin-mazeret':
        return <LeaveForm user={currentUser} />;
      case 'lab-book':
        return <LabBook />;
      case 'satin-alma':
        return <Purchasing />;
      case 'board':
        return <Board user={currentUser} />;
      case 'on-muhasebe':
        return <Accounting />;
      case 'satis':
        return <Sales />;
      case 'projeler':
        return <Projects />;
      case 'kartvizitler':
        return <BusinessCards user={currentUser} />;
      case 'onboarding':
        return <Onboarding user={currentUser} />;
      case 'basin':
        return <Press />;
      case 'sop-prosedur':
        return <SOP />;
      case 'runway':
        return <Runway />;
      case 'arge-plani':
        return <ResearchPlan />;
      case 'lab-stok':
        return <LabStock />;
      case 'distributor':
        return <Distributors />;
      case 'kullanicilar':
        return <UserManagement currentUserId={currentUser.id} />;
      default:
        return <Dashboard onModuleSelect={setCurrentModule} currentUser={currentUser} />;
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <NotificationsProvider currentUserId={currentUser.id}>
    <Layout
      user={currentUser}
      onLogout={handleLogout}
      onGoHome={() => setCurrentModule('pano')}
    >
      <div className="min-h-[calc(100vh-160px)] flex flex-col">
        {currentModule !== 'pano' && (
          <div className="max-w-7xl mx-auto w-full px-8 pt-6">
            <button
              onClick={() => setCurrentModule('pano')}
              className="flex items-center gap-2 text-[12px] text-text-3 hover:text-text mb-4 transition-colors group px-2 py-1 hover:bg-surface-2 rounded-lg w-fit"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Panoya Dön
            </button>
          </div>
        )}

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderModule()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Layout>
    </NotificationsProvider>
  );
}

export default App;
