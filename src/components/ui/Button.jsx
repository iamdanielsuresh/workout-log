import { forwardRef } from 'react';

/**
 * Button component with variants
 */
export const Button = forwardRef(function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props
}, ref) {
  const variants = {
    primary: `
      bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600
      text-gray-950 font-bold tracking-wide
      shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.6)]
      focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-gray-950
      transition-all duration-300
    `,
    secondary: `
      bg-gray-800 hover:bg-gray-700 active:bg-gray-600
      text-gray-100 font-medium
      border border-white/10 hover:border-white/20
      focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-950
    `,
    ghost: `
      bg-transparent hover:bg-gray-800/50 active:bg-gray-800
      text-gray-400 hover:text-gray-100 font-medium
      focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-950
    `,
    danger: `
      bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30
      text-red-400 hover:text-red-300 font-medium
      border border-red-500/30
      focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-950
    `,
    outline: `
      bg-transparent hover:bg-emerald-500/10
      text-emerald-400 hover:text-emerald-300 font-medium
      border border-emerald-500/50 hover:border-emerald-400
      shadow-[0_0_15px_-5px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]
      focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-gray-950
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3.5 text-base rounded-xl gap-2',
    xl: 'px-8 py-4 text-lg rounded-2xl gap-3',
    icon: 'p-2.5 rounded-xl',
  };

  const disabledClass = disabled || loading
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : '';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center
        transition-all duration-200
        active:scale-[0.97]
        select-none
        ${variants[variant]}
        ${sizes[size]}
        ${disabledClass}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
      {!loading && Icon && iconPosition === 'right' ? (
        <Icon className="w-4 h-4" />
      ) : null}
    </button>
  );
});

/**
 * Icon Button - circular button for icons only
 */
export const IconButton = forwardRef(function IconButton({
  icon: Icon,
  className = '',
  variant = 'ghost',
  size = 'md',
  label,
  ...props
}, ref) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <Button
      ref={ref}
      variant={variant}
      size="icon"
      className={`${sizes[size]} rounded-full ${className}`}
      aria-label={label}
      {...props}
    >
      <Icon className={iconSizes[size]} />
    </Button>
  );
});
