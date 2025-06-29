import React from 'react';

interface CompactSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const CompactSelect: React.FC<CompactSelectProps> = ({
  label,
  error,
  options,
  className = '',
  ...props
}) => {  return (
    <div className="space-y-1">
      {label && (
        <label className="text-xs text-gray-600 qc-font-light">
          {label}
        </label>
      )}
      <select
        className={`
          qc-select text-xs px-1.5 py-0.5          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
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
        <p className="text-xs text-red-600 qc-font-light">{error}</p>
      )}
    </div>
  );
};

export default CompactSelect;
