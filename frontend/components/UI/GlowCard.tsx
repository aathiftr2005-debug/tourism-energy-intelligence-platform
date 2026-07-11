'use client';

import { ReactNode } from 'react';
import { PremiumCard } from '@/components/design-system';

interface Props {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function GlowCard({ children, className = '', onClick }: Props) {
  return (
    <PremiumCard className={className} onClick={onClick}>
      {children}
    </PremiumCard>
  );
}
