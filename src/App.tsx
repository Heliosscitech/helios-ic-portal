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
import { SOP } from './components/modules/lab/SOP';
import { ResearchPlan } from './components/modules/lab/ResearchPlan';

// HR
import { LeaveForm } from './components/modules/hr/LeaveForm';
import { Onboarding } from './components/modules/hr/Onboarding';

// Management & Finance
import { Purchasing } from './components/modules/management/Purchasing';
import { Projects } from './components/modules/management/Projects/index';
import { Press } from './components/modules/management/Press/index';
import { ModulePlaceholder } from './components/modules/ModulePlaceholder';
import { Distributors } from './components/modules/management/Distributors';
import { UserManagement } from './components/modules/management/UserManagement/index';
/*import { Accounting } from './components/modules/management/Accounting/index';*/
import { ProfilePage } from './components/profile/ProfilePage';

import type { ModuleId, Responsibility, User, UserRole } from './types/portal';
import { NotificationsProvider } from './lib/notifications';
import { ActiveEntityProvider, useActiveEntity } from './lib/active-entity';
import { NavigationProvider } from './lib/navigation';
import { ToastProvider } from './lib/toast';
import { ConfirmProvider } from './lib/confirm';
import { LeaveReviewModal } from './components/modules/hr/LeaveForm/LeaveReviewModal';
import { supabase } from './lib/supabase';

const CURRENT_MODULE_KEY = 'helios:portal:currentModule';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [currentModule, setCurrentModuleState] = useState<ModuleId>(() => {
    try {
      return (localStorage.getItem(CURRENT_MODULE_KEY) as ModuleId) || 'pano';
    } catch {
      return 'pano';
    }
  });

  const setCurrentModule = (m: ModuleId) => {
    setCurrentModuleState(m);
    try {
      localStorage.setItem(CURRENT_MODULE_KEY, m);
    } catch {
      // localStorage unavailable, ignore
    }
  };

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
        const baseUser: User = {
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
        };
        setCurrentUser(baseUser);
        // avatar_url ayrı fetch edilir; kolonu henüz yoksa login'i bozmaz
        supabase.from('users').select('avatar_url').eq('id', row.id).single()
          .then(({ data: av }) => {
            if (!cancelled && av?.avatar_url) {
              setCurrentUser((u) => u ? { ...u, avatarUrl: av.avatar_url } : u);
            }
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
    if (module === 'profilim') return true;
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
        return <ModulePlaceholder title="Muhasebe" category="Yönetim" />;
      case 'satis':
        return <ModulePlaceholder title="Satış" category="Yönetim" />;
      case 'projeler':
        return <Projects />;
      case 'kartvizitler':
        return <BusinessCards user={currentUser} />;
      case 'onboarding':
        return <Onboarding user={currentUser} />;
      case 'basin':
        return <Press user={currentUser} />;
      case 'sop-prosedur':
        return <SOP user={currentUser} />;
      case 'runway':
        return <ModulePlaceholder title="Runway" category="Yönetim" />;
      case 'arge-plani':
        return <ResearchPlan user={currentUser} />;
      case 'lab-stok':
        return <ModulePlaceholder title="Lab Stok" category="Lab" />;
      case 'distributor':
        return <Distributors user={currentUser} />;
      case 'kullanicilar':
        return <UserManagement currentUserId={currentUser.id} isAdmin={currentUser.userRole === 'yonetici'} />;
      case 'profilim':
        return (
          <ProfilePage
            user={currentUser}
            onBack={() => setCurrentModule('pano')}
            onAvatarChange={(url) => setCurrentUser((u) => u ? { ...u, avatarUrl: url } : u)}
          />
        );
      default:
        return <Dashboard onModuleSelect={setCurrentModule} currentUser={currentUser} />;
    }
  };

  return (
    <NotificationsProvider currentUser={currentUser}>
    <ActiveEntityProvider>
    <NavigationProvider value={{ goHome: () => setCurrentModule('pano') }}>
    <ToastProvider>
    <ConfirmProvider>
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
      onGoProfile={() => setCurrentModule('profilim')}
    >
      <div className="min-h-[calc(100vh-160px)] flex flex-col">
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
    </ConfirmProvider>
    </ToastProvider>
    </NavigationProvider>
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
