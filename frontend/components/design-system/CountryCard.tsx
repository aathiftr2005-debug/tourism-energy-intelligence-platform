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

export default function CountryCard({ country, code, flagSrc, stressScore, className = '', compact = false }: Props) {
  const variant = getBadgeVariant(stressScore);
  const statusLabel = variant === 'critical' ? 'Critical' : variant === 'elevated' ? 'High' : 'Low';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className={`country-card ${compact ? 'country-card--compact' : ''} ${className}`}
    >
      <div className="country-card__flag-bg">
        <Image
          src={flagSrc}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover scale-110 blur-sm opacity-25 group-hover:opacity-35 group-hover:scale-125 transition-all duration-700"
        />
      </div>
      <div className="country-card__overlay" />
      <div className="country-card__content">
        <div className="country-card__flag-badge">
          <Image src={flagSrc} alt={`${country} flag`} fill sizes="32px" className="object-cover" />
        </div>
        <h3 className="country-card__name">{country}</h3>
        <div
          className="country-card__score"
          style={{ color: getStatusColor(stressScore), textShadow: getGlow(stressScore) }}
        >
          {Math.round(stressScore)}
        </div>
        <span className={`badge badge--${variant}`}>{statusLabel}</span>
      </div>
    </motion.div>
  );
}
