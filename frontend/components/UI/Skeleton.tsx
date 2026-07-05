'use client';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
  count?: number;
}

export default function Skeleton({ className = '', width, height, rounded = true, count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count });
  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className={`skeleton ${rounded ? 'rounded-lg' : ''} ${className}`}
          style={{ width, height, ...(count > 1 && i < count - 1 ? { marginBottom: 8 } : {}) }}
        />
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-4">
      <Skeleton width="40%" height="14px" />
      <Skeleton width="60%" height="28px" />
      <Skeleton width="100%" height="8px" />
      <Skeleton width="100%" height="8px" />
      <Skeleton width="30%" height="12px" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 text-disabled">
        {[40, 20, 20, 20].map((w, i) => (
          <Skeleton key={i} width={`${w}%`} height="12px" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {[40, 20, 20, 20].map((w, j) => (
            <Skeleton key={j} width={`${w}%`} height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="flex items-end gap-3 h-[200px] pt-4">
      {[45, 55, 40, 65, 70, 50, 80, 75, 55, 60].map((h, i) => (
        <div
          key={i}
          className="flex-1 skeleton rounded-t-lg"
          style={{ height: `${h}%`, animationDelay: `${i * 0.05}s` }}
        />
      ))}
    </div>
  );
}
