'use client';

import { motion } from 'framer-motion';

interface SeasonalCardProps {
  season: string;
  stress: number;
}

function getStressColor(score: number): string {
  if (score >= 70) return '#ef4444';
  if (score >= 50) return '#f59e0b';
  if (score >= 30) return '#eab308';
  return '#10b981';
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
  const color = getStressColor(stress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl">{getSeasonIcon(season)}</span>
        <div className="h-8 w-16 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <span className="text-xs font-semibold" style={{ color }}>{stress.toFixed(0)}</span>
        </div>
      </div>

      <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{season}</h3>
      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Avg Stress Score</p>

      <div className="mt-3 w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${stress}%` }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}60, ${color})`,
            boxShadow: getStressGlow(stress),
          }}
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: color }}>
          {stress >= 70 ? 'High Risk' : stress >= 50 ? 'Elevated' : stress >= 30 ? 'Moderate' : 'Stable'}
        </span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
      </div>
    </motion.div>
  );
}
