// Simple toast utility for notifications
// Replace with a full toast library if needed

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

const toastListeners: Set<(toast: ToastMessage) => void> = new Set();

export const toast = {
  success: (message: string) => {
    const toastMessage: ToastMessage = {
      id: Math.random().toString(36).slice(2),
      type: 'success',
      message,
    };
    toastListeners.forEach((listener) => listener(toastMessage));
    // Fallback to console if no listeners
    if (toastListeners.size === 0) {
      console.log('✓', message);
    }
  },
  error: (message: string) => {
    const toastMessage: ToastMessage = {
      id: Math.random().toString(36).slice(2),
      type: 'error',
      message,
    };
    toastListeners.forEach((listener) => listener(toastMessage));
    if (toastListeners.size === 0) {
      console.error('✗', message);
    }
  },
  info: (message: string) => {
    const toastMessage: ToastMessage = {
      id: Math.random().toString(36).slice(2),
      type: 'info',
      message,
    };
    toastListeners.forEach((listener) => listener(toastMessage));
    if (toastListeners.size === 0) {
      console.info('ℹ', message);
    }
  },
};

export function addToastListener(listener: (toast: ToastMessage) => void) {
  toastListeners.add(listener);
  return () => toastListeners.delete(listener);
}

export type { ToastMessage, ToastType };
