import { useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        const first = dialogRef.current?.querySelector<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        first?.focus();
      }, 0);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      if (!isOpen) previousFocusRef.current?.focus();
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/80 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={dialogRef}
          className={`
            relative w-full ${sizeStyles[size]}
            bg-white dark:bg-zinc-800
            border-2 border-zinc-900 dark:border-white
            shadow-[8px_8px_0_0_#18181b] dark:shadow-[8px_8px_0_0_#ffffff]
            rounded-[4px]
            animate-scale-in
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center justify-between p-5 border-b-2 border-zinc-900 dark:border-white">
            <h2
              id="modal-title"
              className="text-lg font-black text-zinc-900 dark:text-white"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-[4px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-transparent hover:border-zinc-900 dark:hover:border-white transition-all"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}
