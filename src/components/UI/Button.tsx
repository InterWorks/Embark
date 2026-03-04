import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  tilt?: boolean;
  children: ReactNode;
}

const variantStyles = {
  primary: 'bg-yellow-400 text-zinc-900 border-2 border-zinc-900 shadow-[3px_3px_0_0_#18181b] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-bold dark:shadow-[3px_3px_0_0_#ffffff] dark:border-white dark:hover:shadow-[4px_4px_0_0_#ffffff]',
  secondary: 'bg-white text-zinc-900 border-2 border-zinc-900 shadow-[3px_3px_0_0_#18181b] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-semibold dark:bg-zinc-800 dark:text-white dark:border-white dark:shadow-[3px_3px_0_0_#ffffff] dark:hover:shadow-[4px_4px_0_0_#ffffff]',
  danger: 'bg-red-600 text-white border-2 border-zinc-900 shadow-[3px_3px_0_0_#18181b] hover:bg-red-700 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-bold',
  ghost: 'bg-transparent text-zinc-900 border-2 border-transparent hover:border-zinc-900 dark:text-zinc-100 dark:hover:border-white font-medium',
  success: 'bg-green-500 text-white border-2 border-zinc-900 shadow-[3px_3px_0_0_#18181b] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-bold',
  accent: 'bg-violet-600 text-white border-2 border-zinc-900 shadow-[3px_3px_0_0_#18181b] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#18181b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-bold',
};

const sizeStyles = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  tilt = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-[4px]
        focus:outline-2 focus:outline-offset-2 focus:outline-yellow-400
        transition-all duration-100
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${tilt ? '-rotate-[1.5deg] hover:-rotate-[0.5deg]' : ''}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
