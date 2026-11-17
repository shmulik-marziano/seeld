import React, { createContext, lazy, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AppContextType } from './AppProviderImpl';
import type { AppData } from '../types';

// The agent-app data layer (and supabase-js with it) is a separate chunk. It is
// mounted the first time any component calls useApp() — i.e. only on /app/* and
// the PDage screens — so public pages never download it. Children are never
// remounted: this shell keeps one stable Provider and the lazy implementation
// publishes its value into it.
const AppProviderImpl = lazy(() => import('./AppProviderImpl'));

const EMPTY_DATA: AppData = { customers: [], products: [], recommendations: [], sourceFiles: [], activityLog: [] };

const AppCtx = createContext<{ value: AppContextType; activate: () => void } | null>(null);

export const useApp = () => {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  const { activate } = ctx;
  useEffect(() => { activate(); }, [activate]);
  return ctx.value;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [active, setActive] = useState(false);
  const [impl, setImpl] = useState<AppContextType | null>(null);
  const implRef = useRef<AppContextType | null>(null);
  const activate = useCallback(() => setActive(true), []);
  const onValue = useCallback((v: AppContextType) => { implRef.current = v; setImpl(v); }, []);

  // Placeholder until the implementation chunk has published: guards see
  // `loading: true` (spinner), never a false "logged out" redirect.
  const stub = useMemo<AppContextType>(() => {
    const noop = async () => { throw new Error('AppProvider not ready'); };
    return {
      data: EMPTY_DATA, session: null, loading: true, profile: null, agency: null, needsOnboarding: false,
      addCustomer: noop, updateCustomer: noop, deleteCustomer: noop,
      addProduct: noop, updateProduct: noop, deleteProduct: noop,
      addRecommendation: noop, updateRecommendation: noop, deleteRecommendation: noop,
      addSourceFile: noop, deleteSourceFile: noop,
      logActivity: async () => {}, refreshData: async () => {}, signOut: async () => {},
    };
  }, []);

  const ctxValue = useMemo(() => ({ value: impl ?? stub, activate }), [impl, stub, activate]);

  return (
    <AppCtx.Provider value={ctxValue}>
      {children}
      {active && (
        <Suspense fallback={null}>
          <AppProviderImpl onValue={onValue} />
        </Suspense>
      )}
    </AppCtx.Provider>
  );
};
