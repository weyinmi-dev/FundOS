'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { FundOsStore } from './FundOsStore';

const StoreContext = createContext<FundOsStore | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new FundOsStore());

  useEffect(() => {
    store.init();
    return () => store.dispose();
  }, [store]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useFundOsStore(): FundOsStore {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useFundOsStore must be used within a StoreProvider');
  return store;
}
