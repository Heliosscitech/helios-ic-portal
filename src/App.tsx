import { useEffect, useState } from 'react';
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

import type { ModuleId, Responsibility, User, UserRole } from './types/portal';
import { ArrowLeft } from 'lucide-react';
import { NotificationsProvider } from './lib/notifications';
import { ActiveEntityProvider, useActiveEntity } from './lib/active-entity';
import { LeaveReviewModal } from './components/modules/hr/LeaveForm/LeaveReviewModal';
import { supabase } from './lib/supabase';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [currentModule, setCurrentModule] = useState<ModuleId>('pano');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        setRestoring(false);
        return;
      }
      const { data: row } = await supabase
        .from('users')
        .select('id, legacy_id, name, initials, role, color, user_role, allowed_modules, responsibilities, email')
        .eq('id', session.user.id)
        .single();
      if (cancelled) return;
      if (row) {
        setCurrentUser({
          id: row.legacy_id ?? row.id,
          dbId: row.id,
          email: row.email ?? undefined,
          name: row.name,
          initials: row.initials,
          role: row.role,
          color: row.color,
          userRole: row.user_role as UserRole,
          allowedModules: (row.allowed_modules ?? []) as ModuleId[],
          responsibilities: (row.responsibilities ?? []) as Responsibility[],
        });
      }
      setRestoring(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentModule('pano');
  };

  if (restoring) {
    return (
      <div className="fixed inset-0 bg-[#f5f7f9] flex items-center justify-center">
        <span className="text-[13px] text-text-3">Yükleniyor…</span>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

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
        return <Purchasing user={currentUser} />;
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
        return <ResearchPlan user={currentUser} />;
      case 'lab-stok':
        return <LabStock />;
      case 'distributor':
        return <Distributors user={currentUser} />;
      case 'kullanicilar':
        return <UserManagement currentUserId={currentUser.id} />;
      default:
        return <Dashboard onModuleSelect={setCurrentModule} currentUser={currentUser} />;
    }
  };

  return (
    <NotificationsProvider currentUser={currentUser}>
    <ActiveEntityProvider>
      <ActiveEntityBridge
        currentUserId={currentUser.id}
        onRequestBoard={() => setCurrentModule('board')}
        onRequestPurchasing={() => setCurrentModule('satin-alma')}
        onRequestDistributors={() => setCurrentModule('distributor')}
        onRequestResearchPlan={() => setCurrentModule('arge-plani')}
      />
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
    </ActiveEntityProvider>
    </NotificationsProvider>
  );
}

interface BridgeProps {
  currentUserId: string;
  onRequestBoard: () => void;
  onRequestPurchasing: () => void;
  onRequestDistributors: () => void;
  onRequestResearchPlan: () => void;
}

const ActiveEntityBridge = ({
  currentUserId,
  onRequestBoard,
  onRequestPurchasing,
  onRequestDistributors,
  onRequestResearchPlan,
}: BridgeProps) => {
  const { active, clear } = useActiveEntity();

  useEffect(() => {
    if (active?.source === 'board') onRequestBoard();
    if (active?.source === 'satin-alma') onRequestPurchasing();
    if (active?.source === 'distributor') onRequestDistributors();
    if (active?.source === 'arge') onRequestResearchPlan();
  }, [active, onRequestBoard, onRequestPurchasing, onRequestDistributors, onRequestResearchPlan]);

  if (active?.source === 'leave') {
    return (
      <LeaveReviewModal
        requestId={active.entityId}
        currentUserId={currentUserId}
        onClose={clear}
      />
    );
  }

  return null;
};

export default App;
