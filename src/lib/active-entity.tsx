import React, { createContext, useCallback, useContext, useState } from 'react';

export type ActiveEntitySource = 'board' | 'leave' | 'satin-alma' | 'distributor' | 'arge';

export interface ActiveEntity {
  source: ActiveEntitySource;
  entityId: string;
}

interface ActiveEntityStore {
  active: ActiveEntity | null;
  open: (entity: ActiveEntity) => void;
  clear: () => void;
}

const ActiveEntityContext = createContext<ActiveEntityStore | null>(null);

export const ActiveEntityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [active, setActive] = useState<ActiveEntity | null>(null);

  const open = useCallback((entity: ActiveEntity) => setActive(entity), []);
  const clear = useCallback(() => setActive(null), []);

  return (
    <ActiveEntityContext.Provider value={{ active, open, clear }}>
      {children}
    </ActiveEntityContext.Provider>
  );
};

export const useActiveEntity = (): ActiveEntityStore => {
  const ctx = useContext(ActiveEntityContext);
  if (!ctx) {
    throw new Error('useActiveEntity must be used inside <ActiveEntityProvider>');
  }
  return ctx;
};
