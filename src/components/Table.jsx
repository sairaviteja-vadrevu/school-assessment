import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const Table = ({
  columns,
  data,
  onRowClick,
  sortable = true,
  striped = true,
  className = '',
  emptyMessage = 'No data available',
}) => {
  const [sortConfig, setSortConfig] = useState(null);

  const handleSort = (key) => {
    if (!sortable) return;

    let direction = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    if (!sortConfig) return data;

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const sortedData = getSortedData();

  const tableStyles = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--border-radius)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-md)',
  };

  const theadStyles = {
    backgroundColor: 'var(--color-background)',
    borderBottom: '2px solid var(--color-border)',
  };

  const thStyles = {
    padding: '16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--color-text)',
    cursor: sortable ? 'pointer' : 'default',
    userSelect: 'none',
    transition: 'var(--transition-fast)',
  };

  const thHoverStyles = {
    backgroundColor: sortable ? 'var(--color-border-light)' : 'transparent',
  };

  const tdStyles = {
    padding: '16px',
    fontSize: '14px',
    color: 'var(--color-text)',
    borderBottom: '1px solid var(--color-border-light)',
  };

  const trHoverStyles = {
    backgroundColor: onRowClick ? 'var(--color-background)' : 'transparent',
    cursor: onRowClick ? 'pointer' : 'default',
    transition: 'var(--transition-fast)',
  };

  const emptyStyles = {
    padding: '48px 16px',
    textAlign: 'center',
    color: 'var(--color-text-light)',
  };

  const SortIcon = ({ columnKey }) => {
    if (!sortable || sortConfig?.key !== columnKey) {
      return <span style={{ opacity: 0.3, marginLeft: '8px' }}>↕</span>;
    }
    return (
      <span style={{ marginLeft: '8px' }}>
        {sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </span>
    );
  };

  return (
    <div style={{ overflowX: 'auto' }} className={className}>
      {sortedData.length === 0 ? (
        <div style={emptyStyles}>{emptyMessage}</div>
      ) : (
        <table style={tableStyles}>
          <thead style={theadStyles}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={thStyles}
                  onMouseEnter={(e) => {
                    if (sortable) {
                      Object.assign(e.currentTarget.style, thHoverStyles);
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-background)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {col.label}
                    {col.sortable !== false && <SortIcon columnKey={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                style={trHoverStyles}
                onMouseEnter={(e) => {
                  if (onRowClick) {
                    e.currentTarget.style.backgroundColor = 'var(--color-background)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {columns.map((col) => (
                  <td key={`${rowIndex}-${col.key}`} style={tdStyles}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Table;
