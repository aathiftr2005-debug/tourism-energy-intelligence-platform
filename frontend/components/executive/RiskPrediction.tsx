'use client';

import { motion } from 'framer-motion';
import { EmergencyService } from '@/lib/services';
import { useTheme } from '@/lib/theme/ThemeContext';
import { getChartColors } from '@/lib/theme/chartColors';
import ExecutiveCard from '@/components/design-system/ExecutiveCard';

const risks = EmergencyService.getRisks();

const levelConfig: Record<string, { color: string; label: string }> = {
  critical: { color: 'var(--color-critical)', label: 'Critical' },
  high: { color: 'var(--color-elevated)', label: 'High' },
  medium: { color: 'var(--color-accent)', label: 'Medium' },
  low: { color: 'var(--color-normal)', label: 'Low' },
};

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  const color = trend === 'up' ? 'var(--color-critical)' : trend === 'down' ? 'var(--color-normal)' : 'var(--color-elevated)';
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {trend === 'up' && <polyline points="18 15 12 9 6 15" />}
      {trend === 'down' && <polyline points="6 9 12 15 18 9" />}
      {trend === 'stable' && <line x1="5" y1="12" x2="19" y2="12" />}
    </svg>
  );
}

export default function RiskPrediction() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getChartColors(isDark);

  return (
    <ExecutiveCard
      title="Risk Prediction"
      subtitle="Probability and severity forecasts"
      icon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-elevated)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
        </svg>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {risks.map((risk, i) => {
          const lvl = levelConfig[risk.level];
          return (
            <motion.div
              key={risk.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl p-4"
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-heading">{risk.title}</span>
                <div className="flex items-center gap-2">
                  <TrendArrow trend={risk.trend} />
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: `${lvl.color}15`, border: `1px solid ${lvl.color}30`, color: lvl.color }}>
                    {lvl.label}
                  </span>
                </div>
              </div>

              <div className="flex items-end justify-between mb-2">
                <span className="text-[10px] text-caption">Probability</span>
                <motion.span
                  key={risk.id + risk.probability}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-lg font-bold"
                  style={{ color: lvl.color, textShadow: `0 0 15px ${lvl.color}30` }}
                >
                  {risk.probability}%
                </motion.span>
              </div>

              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: colors.grid }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${risk.probability}%`,
                    background: `linear-gradient(90deg, ${lvl.color}60, ${lvl.color})`,
                    boxShadow: `0 0 8px ${lvl.color}40`,
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1) 0.4s',
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </ExecutiveCard>
  );
}
