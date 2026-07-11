'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'critical' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  loading?: boolean;
}

export default function PremiumButton({ children, variant = 'primary', size = 'md', icon, loading, disabled, className = '', ...rest }: Props) {
  return (
    <button
      className={`premium-btn premium-btn--${variant} premium-btn--${size} ${loading ? 'premium-btn--loading' : ''} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="premium-btn__spinner" />
      ) : icon ? (
        <span className="premium-btn__icon">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
}
