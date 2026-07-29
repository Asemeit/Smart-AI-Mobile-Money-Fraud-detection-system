import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckIcon, AlertIcon } from '../components/Icons';
import '../components/Toast.css';

const ToastContext = createContext(null);

function ToastIcon({ type }) {
  if (type === 'success') return <CheckIcon size={18} />;
  if (type === 'danger') return <AlertIcon size={18} />;
  if (type === 'warning') return <AlertIcon size={18} />;
  return null;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`} role="alert">
            <div className="toast-icon">
              <ToastIcon type={toast.type} />
            </div>
            <div className="toast-body">
              {toast.title && <strong>{toast.title}</strong>}
              <p>{toast.message}</p>
            </div>
            <button type="button" className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
