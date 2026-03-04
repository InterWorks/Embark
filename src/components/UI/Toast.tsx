import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'undo';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type'], action?: Toast['action']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: Toast['type'] = 'info', action?: Toast['action']) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type, action }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, action ? 6000 : 4000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-6 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, toast.action ? 5500 : 3500);

    return () => clearTimeout(timer);
  }, [toast.action]);

  const typeIconBg = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    undo: 'bg-violet-700',
  };

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    undo: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
      </svg>
    ),
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-[4px] bg-white dark:bg-zinc-800 border-2 border-zinc-900 dark:border-white shadow-[4px_4px_0_0_#18181b] dark:shadow-[4px_4px_0_0_#ffffff] transition-all duration-300 animate-toast-enter ${
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}
    >
      <div className={`p-1.5 rounded-[4px] ${typeIconBg[toast.type]} text-white`}>
        {icons[toast.type]}
      </div>
      <p className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">{toast.message}</p>
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick();
            onDismiss();
          }}
          className="ml-2 px-3 py-1 text-sm font-bold text-violet-700 dark:text-yellow-400 hover:underline rounded-[4px] transition-colors"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={onDismiss}
        className="ml-auto p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
