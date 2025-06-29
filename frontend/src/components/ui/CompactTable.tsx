import React from 'react';

interface CompactTableProps {
  headers: (string | React.ReactNode)[];
  children: React.ReactNode;
  className?: string;
}

const CompactTable: React.FC<CompactTableProps> = ({
  headers,
  children,
  className = ''
}) => {  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="qc-table text-xs">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-2 py-1 text-left qc-font-light text-gray-700"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
};

interface CompactTableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const CompactTableRow: React.FC<CompactTableRowProps> = ({
  children,
  className = '',
  onClick
}) => {
  return (
    <tr
      className={`hover:bg-gray-50 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

interface CompactTableCellProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  colSpan?: number;
}

export const CompactTableCell: React.FC<CompactTableCellProps> = ({
  children,
  className = '',
  style,
  colSpan
}) => {
  return (
    <td 
      className={`px-2 py-1 text-gray-900 whitespace-nowrap font-light ${className}`}
      style={style}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
};

export default CompactTable;
