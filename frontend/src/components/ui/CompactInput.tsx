import React from 'react';

interface CompactInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const CompactInput: React.FC<CompactInputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {  return (
    <div className="space-y-1">
      {label && (
        <label className="text-xs text-gray-600 qc-font-light">
          {label}
        </label>
      )}
      <input
        className={`
          qc-input text-xs px-1.5 py-0.5
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-600 qc-font-light">{error}</p>
      )}
    </div>
  );
};

export default CompactInput;
