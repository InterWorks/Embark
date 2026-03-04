import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-2.5 rounded-[4px]
            bg-white dark:bg-zinc-800
            text-zinc-900 dark:text-zinc-100
            border-2 border-zinc-900 dark:border-white
            placeholder-zinc-400 dark:placeholder-zinc-500
            focus:outline-none focus:shadow-[2px_2px_0_0_#facc15]
            disabled:bg-zinc-100 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed
            transition-shadow duration-100
            ${error ? 'border-red-600 focus:shadow-[2px_2px_0_0_#dc2626]' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
