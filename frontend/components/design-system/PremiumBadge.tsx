'use client';

import { ReactNode } from 'react';

type Variant = 'critical' | 'elevated' | 'normal' | 'accent' | 'info' | 'muted';

interface Props {
  children: ReactNode;
  variant?: Variant;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export default function PremiumBadge({ children, variant = 'accent', dot = false, size = 'sm', className = '' }: Props) {
  return (
    <span className={`badge badge--${variant} badge--${size} ${dot ? 'badge--dot' : ''} ${className}`}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
}
