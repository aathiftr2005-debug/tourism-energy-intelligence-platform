'use client';

import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
  emptyMessage?: string;
}

export default function PremiumTable<T extends Record<string, unknown>>({ columns, data, className = '', emptyMessage = 'No data available' }: Props<T>) {
  return (
    <div className={`premium-table-wrapper ${className}`}>
      <table className="premium-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className || ''}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="premium-table__empty">{emptyMessage}</td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key} className={col.className || ''}>
                    {col.render ? col.render(row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
