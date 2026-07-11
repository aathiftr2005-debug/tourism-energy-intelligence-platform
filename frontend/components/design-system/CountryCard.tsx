'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface Props {
  country: string;
  code: string;
  flagSrc: string;
  stressScore: number;
  className?: string;
  compact?: boolean;
}

function getStatusColor(score: number): string {
  if (score >= 70) return 'var(--color-critical)';
  if (score >= 50) return 'var(--color-elevated)';
  if (score >= 30) return 'var(--color-elevated)';
  return 'var(--color-normal)';
}

function getBadgeVariant(score: number): 'critical' | 'elevated' | 'normal' {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'elevated';
  if (score >= 30) return 'elevated';
  return 'normal';
}

function getGlow(score: number): string {
  if (score >= 70) return '0 0 30px var(--color-critical-30)';
  if (score >= 50) return '0 0 25px var(--color-elevated-30)';
  if (score >= 30) return '0 0 20px var(--color-elevated-15)';
  return '0 0 15px var(--color-normal-15)';
}

function getStatusLabel(score: number): string {
  if (score >= 70) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 30) return 'Moderate';
  return 'Stable';
}

export default function CountryCard({ country, code, flagSrc, stressScore, className = '', compact = false }: Props) {
  const variant = getBadgeVariant(stressScore);
  const statusLabel = getStatusLabel(stressScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={`country-card-v2 ${compact ? 'country-card-v2--compact' : ''} ${className}`}
    >
      <div className="country-card-v2__flag">
        <Image
          src={flagSrc}
          alt={`${country} flag`}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 200px"
        />
        <div className="country-card-v2__flag-gradient" />
      </div>

      <div className="country-card-v2__body">
        <h3 className="country-card-v2__name">{country}</h3>

        <div
          className="country-card-v2__score"
          style={{ color: getStatusColor(stressScore), textShadow: getGlow(stressScore) }}
        >
          {Math.round(stressScore)}
        </div>

        <span className={`badge badge--${variant} badge--md country-card-v2__badge`}>
          {statusLabel}
        </span>
      </div>
    </motion.div>
  );
}
