import React from 'react';

interface TextButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'text';
  size?: 'xs' | 'sm' | 'md';
  isLoading?: boolean;
  children: React.ReactNode;
}

const TextButton: React.FC<TextButtonProps> = ({
  variant = 'primary',
  size = 'sm',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {  const baseClasses = 'qc-btn qc-btn-text transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'text-primary-600 hover:text-primary-800',
    secondary: 'text-gray-600 hover:text-gray-800',
    danger: 'text-red-600 hover:text-red-800',
    success: 'text-secondary-600 hover:text-secondary-800',
    text: 'text-gray-700 hover:text-gray-900',
  };
  
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-1 h-3 w-3"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default TextButton;
