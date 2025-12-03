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
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
      )}
      <input
        ref={ref}
        type={type}
        className={`
          w-full bg-gray-800/50 border border-gray-700
          text-gray-100 placeholder:text-gray-500
          rounded-xl transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
          disabled:opacity-50 disabled:cursor-not-allowed
          ${Icon ? 'pl-10 pr-4' : 'px-4'} py-3
          ${error ? 'border-red-500/50 focus:ring-red-500/50' : ''}
          ${className}
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
        className="flex-1 bg-transparent text-center text-gray-100 font-semibold 
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
 * Textarea component
 */
export const Textarea = forwardRef(function Textarea({
  className = '',
  error,
  ...props
}, ref) {
  return (
    <textarea
      ref={ref}
      className={`
        w-full bg-gray-800/50 border border-gray-700
        text-gray-100 placeholder:text-gray-500
        rounded-xl px-4 py-3 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        resize-none
        ${error ? 'border-red-500/50 focus:ring-red-500/50' : ''}
        ${className}
      `}
      {...props}
    />
  );
});
