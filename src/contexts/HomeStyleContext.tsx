'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type HomeStyle = 1 | 2 | 3;

interface HomeStyleContextType {
  homeStyle: HomeStyle;
  setHomeStyle: (style: HomeStyle) => void;
}

const HomeStyleContext = createContext<HomeStyleContextType | undefined>(undefined);

export function HomeStyleProvider({ children }: { children: ReactNode }) {
  const [homeStyle, setHomeStyleState] = useState<HomeStyle>(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('homeStyle');
    if (saved === '1' || saved === '2' || saved === '3') {
      setHomeStyleState(Number(saved) as HomeStyle);
    }
  }, []);

  const setHomeStyle = (style: HomeStyle) => {
    setHomeStyleState(style);
    localStorage.setItem('homeStyle', String(style));
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <HomeStyleContext.Provider value={{ homeStyle, setHomeStyle }}>
      {children}
    </HomeStyleContext.Provider>
  );
}

export function useHomeStyle() {
  const context = useContext(HomeStyleContext);
  // Return default values if used outside provider (during SSR/build)
  if (context === undefined) {
    return { homeStyle: 1 as const, setHomeStyle: () => {} };
  }
  return context;
}
