import { ChevronDown } from 'lucide-react';

/**
 * Custom Select component with consistent styling
 */
export function Select({ 
  value, 
  onChange, 
  options, 
  icon: Icon, 
  placeholder, 
  className = '',
  disabled = false
}) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full bg-gray-900/50 border border-white/10
          text-gray-100 placeholder:text-gray-600
          rounded-xl transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50
          appearance-none
          disabled:opacity-50 disabled:cursor-not-allowed
          ${Icon ? 'pl-10 pr-10' : 'px-4 pr-10'} py-3
          ${className}
        `}
      >
        <option value="">{placeholder || 'Select'}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
}
