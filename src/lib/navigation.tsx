import { createContext, useContext } from 'react';

// Modül içeriklerinden ana panoya dönmek için context.
// App.tsx setCurrentModule('pano') değerini provide eder.
type NavigationCtx = {
  goHome: () => void;
};

const NavigationContext = createContext<NavigationCtx | null>(null);

export const NavigationProvider = NavigationContext.Provider;

export const useNavigation = (): NavigationCtx => {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
};
