import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full px-4 py-2.5 rounded-xl border
            bg-white/50 dark:bg-white/5
            backdrop-blur-sm
            text-gray-900 dark:text-gray-100
            border-white/30 dark:border-white/10
            focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50
            focus:bg-white/70 dark:focus:bg-white/10
            disabled:bg-gray-100/50 dark:disabled:bg-gray-700/50 disabled:cursor-not-allowed
            transition-all duration-200
            ${error ? 'border-red-400/50 focus:ring-red-500/50' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
