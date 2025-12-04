import { forwardRef } from 'react';

/**
 * Input component with dark styling
 */
export const Input = forwardRef(function Input({
  className = '',
  type = 'text',
  error,
  icon: Icon,
  ...props
}, ref) {
  return (
    <div className={`
      relative flex items-center gap-3 px-4
      w-full bg-gray-900/50 border border-white/10
      rounded-xl transition-all duration-200
      focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500/50
      ${error ? 'border-red-500/50 focus-within:ring-red-500/20' : ''}
      ${className}
    `}>
      {Icon && (
        <Icon className="w-5 h-5 text-gray-500 flex-shrink-0" />
      )}
      <input
        ref={ref}
        type={type}
        className={`
          flex-1 min-w-0 bg-transparent border-none
          text-gray-100 placeholder:text-gray-600
          focus:outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
          py-3
        `}
        {...props}
      />
    </div>
  );
});

/**
 * Number input with stepper buttons
 */
export const NumberInput = forwardRef(function NumberInput({
  value,
  onChange,
  onIncrement,
  onDecrement,
  placeholder,
  className = '',
  min,
  max,
  step = 1,
  ...props
}, ref) {
  const handleIncrement = () => {
    const newValue = (parseFloat(value) || 0) + step;
    if (max !== undefined && newValue > max) return;
    onIncrement?.(newValue);
  };

  const handleDecrement = () => {
    const newValue = (parseFloat(value) || 0) - step;
    if (min !== undefined && newValue < min) return;
    onDecrement?.(newValue);
  };

  return (
    <div className={`flex items-center bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={handleDecrement}
        className="p-3 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-colors active:bg-gray-700"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      <input
        ref={ref}
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-center text-gray-100 font-display font-bold text-lg
                   placeholder:text-gray-600 focus:outline-none min-w-0 py-2"
        {...props}
      />
      <button
        type="button"
        onClick={handleIncrement}
        className="p-3 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 transition-colors active:bg-gray-700"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
});

/**
 * Textarea component with mobile-friendly keyboard handling
 */
export const Textarea = forwardRef(function Textarea({
  className = '',
  error,
  disableAutoEdit = false,
  ...props
}, ref) {
  // Props for disabling auto-editing behavior
  const autoEditProps = disableAutoEdit ? {
    autoComplete: 'off',
    autoCorrect: 'off',
    autoCapitalize: 'none',
    spellCheck: false,
    'data-gramm': 'false',
    'data-gramm_editor': 'false',
    'data-enable-grammarly': 'false',
  } : {};

  return (
    <textarea
      ref={ref}
      className={`
        w-full bg-gray-900/50 border border-white/10
        text-gray-100 placeholder:text-gray-600
        rounded-xl px-4 py-3 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        resize-none
        ${error ? 'border-red-500/50 focus:ring-red-500/20' : ''}
        ${className}
      `}
      {...autoEditProps}
      {...props}
    />
  );
});
