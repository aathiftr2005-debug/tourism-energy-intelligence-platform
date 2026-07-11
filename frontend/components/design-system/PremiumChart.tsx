'use client';

import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title?: string;
  height?: string;
  className?: string;
}

export default function PremiumChart({ children, title, height = '300px', className = '' }: Props) {
  return (
    <div className={`premium-chart ${className}`}>
      {title && <h3 className="premium-chart__title">{title}</h3>}
      <div className="premium-chart__container" style={{ height }}>
        {children}
      </div>
    </div>
  );
}
