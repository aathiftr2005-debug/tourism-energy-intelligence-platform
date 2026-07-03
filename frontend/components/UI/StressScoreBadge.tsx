'use client';

interface Props {
  level: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
  score: number;
}

const config = {
  NORMAL: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', emoji: '\ud83d\udfe2', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]' },
  ELEVATED: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', emoji: '\ud83d\udfe1', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.2)]' },
  CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', emoji: '\ud83d\udd34', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.2)]' },
};

export default function StressScoreBadge({ level, score }: Props) {
  const c = config[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${c.glow}`}
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      <span>{c.emoji}</span>
      <span>{score.toFixed(1)}</span>
    </span>
  );
}
