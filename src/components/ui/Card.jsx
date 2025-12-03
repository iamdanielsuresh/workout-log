import { forwardRef } from 'react';

/**
 * Card component - base container with dark glass effect
 */
export const Card = forwardRef(function Card({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  onClick,
  ...props 
}, ref) {
  const variants = {
    default: 'bg-gray-900/40 backdrop-blur-2xl border-white/5 shadow-xl shadow-black/20',
    elevated: 'bg-gray-800/80 backdrop-blur-xl border-white/10 shadow-2xl shadow-black/40',
    accent: 'bg-gradient-to-br from-gray-900/60 to-emerald-900/20 backdrop-blur-xl border-emerald-500/20 shadow-lg shadow-emerald-900/10',
    ghost: 'bg-transparent border-white/5',
  };

  const hoverClass = hover && onClick 
    ? 'hover:bg-gray-800/50 hover:border-white/10 active:scale-[0.98] cursor-pointer' 
    : '';

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`
        relative overflow-hidden backdrop-blur-xl 
        border rounded-2xl transition-all duration-200
        ${variants[variant]}
        ${hoverClass}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * Card Header
 */
export function CardHeader({ children, className = '' }) {
  return (
    <div className={`p-4 border-b border-gray-800/50 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Card Content
 */
export function CardContent({ children, className = '' }) {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Card Footer
 */
export function CardFooter({ children, className = '' }) {
  return (
    <div className={`p-4 border-t border-gray-800/50 ${className}`}>
      {children}
    </div>
  );
}
