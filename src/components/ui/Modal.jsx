import { useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

/**
 * Modal/Dialog component with focus trap and keyboard support
 * Enhanced for mobile keyboard handling
 */
export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showClose = true 
}) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Handle escape key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Handle visual viewport changes (mobile keyboard)
    const handleViewportChange = () => {
      if (modalRef.current) {
        // Keep modal in view when keyboard opens
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          setTimeout(() => {
            activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    };

    // Listen for visual viewport changes (keyboard open/close)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }

    document.addEventListener('keydown', handleKeyDown);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
      document.body.style.overflow = '';
      // Restore focus to previously focused element
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[calc(100vw-2rem)]',
  };

  // Prevent backdrop click from closing when interacting with form
  const handleBackdropClick = (e) => {
    // Only close if clicking directly on backdrop, not bubbling from children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Content - Centered modal with safe area padding */}
      <div 
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative w-full ${sizes[size]}
          bg-gray-900 border border-gray-800 shadow-2xl
          animate-in fade-in zoom-in-95 duration-200
          rounded-2xl
          max-h-[calc(100vh-8rem)] sm:max-h-[85vh]
          flex flex-col
          outline-none
        `}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-800 flex-shrink-0">
            {title && (
              <h3 id="modal-title" className="text-lg font-bold text-gray-100">{title}</h3>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        
        {/* Body - scrollable */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Confirm Dialog - for destructive actions
 */
export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onCancel} 
      />
      
      <div className="relative w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl ${
            variant === 'danger' 
              ? 'bg-red-500/10 text-red-400' 
              : 'bg-amber-500/10 text-amber-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-100">{title}</h3>
        </div>
        
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            className="flex-1"
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button 
            variant={variant}
            className="flex-1"
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
