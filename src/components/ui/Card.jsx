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
    default: 'bg-gray-900/80 border-gray-800',
    elevated: 'bg-gray-800/90 border-gray-700',
    accent: 'bg-gray-900/80 border-emerald-500/30',
    ghost: 'bg-transparent border-gray-800/50',
  };

  const hoverClass = hover && onClick 
    ? 'hover:bg-gray-800/90 hover:border-gray-700 active:scale-[0.98] cursor-pointer' 
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
