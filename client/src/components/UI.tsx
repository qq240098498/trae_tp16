import { useState } from 'react';
import type { ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;
type Listener = (toasts: Toast[]) => void;
let listeners: Listener[] = [];
let state: Toast[] = [];

function notify() {
  listeners.forEach(l => l(state));
}

export function toast(message: string, type: Toast['type'] = 'info') {
  const id = ++toastId;
  state = [...state, { id, message, type }];
  notify();
  setTimeout(() => {
    state = state.filter(t => t.id !== id);
    notify();
  }, 2500);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>(state);

  useState(() => {
    const listener: Listener = setToasts;
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  });

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-sm text-white transition-all animate-fade-in ${
            t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-gray-800'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-900">{title}</div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    ghost: 'hover:bg-gray-100 text-gray-700',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
