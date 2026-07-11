'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme/ThemeContext';
import { getChartColors } from '@/lib/theme/chartColors';
import { PremiumCard } from '@/components/design-system';

interface SeasonalCardProps {
  season: string;
  stress: number;
}

function getStressColor(score: number): string {
  if (score >= 70) return 'var(--color-critical)';
  if (score >= 50) return 'var(--color-elevated)';
  if (score >= 30) return 'var(--color-elevated)';
  return 'var(--color-normal)';
}

function getStressGlow(score: number): string {
  if (score >= 70) return '0 0 20px rgba(239,68,68,0.25)';
  if (score >= 50) return '0 0 15px rgba(245,158,11,0.2)';
  if (score >= 30) return '0 0 12px rgba(234,179,8,0.15)';
  return '0 0 10px rgba(16,185,129,0.12)';
}

function getSeasonIcon(season: string): string {
  switch (season) {
    case 'Winter': return '\u2744\ufe0f';
    case 'Spring': return '\ud83c\udf38';
    case 'Summer': return '\u2600\ufe0f';
    case 'Autumn': return '\ud83c\udf42';
    default: return '';
  }
}

export default function SeasonalCard({ season, stress }: SeasonalCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getChartColors(isDark);
  const color = getStressColor(stress);

  const cardBg = 'var(--color-card)';
  const cardBorder = 'var(--color-border)';
  const trackBg = 'var(--color-border)';

  return (
    <PremiumCard className="relative overflow-hidden p-5" hover={false}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl">{getSeasonIcon(season)}</span>
        <div className="h-8 w-16 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)` }}>
          <span className="text-xs font-semibold" style={{ color }}>{stress.toFixed(0)}</span>
        </div>
      </div>

      <h3 className="text-body text-sm font-semibold">{season}</h3>
      <p className="text-caption text-xs mt-1">Avg Stress Score</p>

      <div className="mt-3 w-full h-1.5 rounded-full overflow-hidden" style={{ background: trackBg }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${stress}%` }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, color-mix(in srgb, ${color} 60%, transparent), ${color})`,
            boxShadow: getStressGlow(stress),
          }}
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color }}>
          {stress >= 70 ? 'High Risk' : stress >= 50 ? 'Elevated' : stress >= 30 ? 'Moderate' : 'Stable'}
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
      </div>
    </PremiumCard>
  );
}
