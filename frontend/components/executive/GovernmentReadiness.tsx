'use client';

import { motion } from 'framer-motion';
import data from '@/data/executive.json';
import { useTheme } from '@/lib/theme/ThemeContext';
import { getChartColors } from '@/lib/theme/chartColors';
import ExecutiveCard from '@/components/design-system/ExecutiveCard';

const { overall, scores } = data.governmentReadiness;

function getScoreColor(score: number): string {
  if (score >= 80) return 'var(--color-normal)';
  if (score >= 65) return 'var(--color-elevated)';
  return 'var(--color-critical)';
}

export default function GovernmentReadiness() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getChartColors(isDark);

  return (
    <ExecutiveCard
      title="Government Readiness"
      subtitle="Preparedness assessment by category"
      icon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-normal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      }
    >
      <div className="flex items-center justify-center mb-5">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-2">
            <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke={colors.track} strokeWidth="4" />
              <circle cx="40" cy="40" r="34" fill="none" stroke={getScoreColor(overall)} strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={213.63}
                strokeDashoffset={213.63 - (213.63 * overall) / 100}
                style={{ transition: 'stroke-dashoffset 1.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold" style={{ color: getScoreColor(overall) }}>{overall}</span>
            </div>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Overall</span>
        </div>
      </div>

      <div className="space-y-3">
        {scores.map((item, i) => {
          const color = getScoreColor(item.score);
          return (
            <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-[11px] font-medium text-muted">{item.label}</span>
                </div>
                <span className="text-[11px] font-semibold" style={{ color }}>{item.score}</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: colors.grid }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${color}60, ${color})`, boxShadow: `0 0 6px ${color}30` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </ExecutiveCard>
  );
}
