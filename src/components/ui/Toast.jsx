import { useEffect } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Toast notification component
 */
export function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const styles = {
    success: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
    error: 'bg-red-500 text-white shadow-lg shadow-red-500/30',
    warning: 'bg-amber-500 text-gray-900 shadow-lg shadow-amber-500/30',
    info: 'bg-blue-500 text-white shadow-lg shadow-blue-500/30',
  };

  const icons = {
    success: CheckCircle2,
    error: AlertTriangle,
    warning: AlertTriangle,
    info: CheckCircle2,
  };

  const Icon = icons[type];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-2 duration-200">
      <div className={`relative overflow-hidden flex items-center gap-3 px-5 py-3 rounded-xl ${styles[type]}`}>
        <Icon className="w-5 h-5 shrink-0" />
        <span className="font-medium text-sm">{message}</span>
        <button 
          onClick={onClose} 
          className="ml-1 p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
          <div 
            className="h-full bg-white/60"
            style={{ 
              width: '100%',
              animation: `shrink ${duration}ms linear forwards`
            }} 
          />
        </div>
      </div>
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

/**
 * Toast container for managing multiple toasts
 */
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}
