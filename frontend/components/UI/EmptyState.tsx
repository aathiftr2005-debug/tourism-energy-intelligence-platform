'use client';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({
  title = 'No data available',
  description = 'There is nothing to display yet. Data may still be loading or the selected filters returned no results.',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'var(--color-accent-8)', border: '1px solid var(--color-accent-20)' }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="12" y1="13" x2="12" y2="17" />
        </svg>
      </div>
      <h3 className="text-muted text-sm font-semibold mb-1">{title}</h3>
      <p className="text-caption text-xs max-w-xs leading-relaxed">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary text-xs mt-4">
          {action.label}
        </button>
      )}
    </div>
  );
}
