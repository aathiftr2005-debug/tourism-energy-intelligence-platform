'use client';

import { CountryCard as DesignCountryCard } from '@/components/design-system';

interface CountryCardProps {
  country: string;
  flagSrc: string;
  stressScore: number;
  status?: string;
  code?: string;
  className?: string;
  compact?: boolean;
}

export default function CountryCard({ country, flagSrc, stressScore, code = '', className, compact }: CountryCardProps) {
  return (
    <DesignCountryCard
      country={country}
      code={code}
      flagSrc={flagSrc}
      stressScore={stressScore}
      className={className}
      compact={compact}
    />
  );
}
