import * as React from 'react';

export interface NavState<T = string> {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stack: T[];
  current?: T;
  push: (screen: T) => void;
  pop: () => void;
  reset: (screen: T) => void;
}

const NavCtx = React.createContext<NavState<any> | null>(null);

export function NavProvider<T = string>({
  initialTab = 'home',
  initialScreen,
  children,
}: {
  initialTab?: string;
  initialScreen?: T;
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = React.useState<string>(initialTab);
  const [stack, setStack] = React.useState<T[]>(
    initialScreen ? [initialScreen] : []
  );

  const push = React.useCallback((screen: T) => {
    setStack((st) => [...st, screen]);
  }, []);

  const pop = React.useCallback(() => {
    setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));
  }, []);

  const reset = React.useCallback((screen: T) => {
    setStack([screen]);
  }, []);

  const value = React.useMemo<NavState<T>>(() => ({
    activeTab,
    setActiveTab,
    stack,
    current: stack[stack.length - 1],
    push,
    pop,
    reset,
  }), [activeTab, stack, push, pop, reset]);

  return <NavCtx.Provider value={value}>{children}</NavCtx.Provider>;
}

export function useNav<T = string>(): NavState<T> {
  const ctx = React.useContext(NavCtx);
  if (!ctx) {
    throw new Error('useNav must be used within a NavProvider');
  }
  return ctx as NavState<T>;
}
