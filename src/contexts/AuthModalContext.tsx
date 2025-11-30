'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type AuthView = 'login' | 'register' | 'forgot-password';

interface AuthModalContextType {
  isOpen: boolean;
  view: AuthView;
  reason: string | null;
  openModal: (view?: AuthView, reason?: string) => void;
  closeModal: () => void;
  setView: (view: AuthView) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<AuthView>('login');
  const [reason, setReason] = useState<string | null>(null);

  const openModal = useCallback((initialView: AuthView = 'login', openReason?: string) => {
    setView(initialView);
    setReason(openReason || null);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setReason(null);
  }, []);

  // Listen for custom events
  React.useEffect(() => {
    const handleOpenModal = (e: CustomEvent<{ view?: AuthView; reason?: string }>) => {
      openModal(e.detail?.view || 'login', e.detail?.reason);
    };

    window.addEventListener('openAuthModal', handleOpenModal as EventListener);
    return () => {
      window.removeEventListener('openAuthModal', handleOpenModal as EventListener);
    };
  }, [openModal]);

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        view,
        reason,
        openModal,
        closeModal,
        setView,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}
