'use client';

import { motion } from 'framer-motion';
import { EmergencyService } from '@/lib/services';
import { useTheme } from '@/lib/theme/ThemeContext';
import { getChartColors } from '@/lib/theme/chartColors';

const risks = EmergencyService.getRisks();

const levelConfig: Record<string, { color: string; label: string }> = {
  critical: { color: '#ef4444', label: 'Critical' },
  high: { color: '#f59e0b', label: 'High' },
  medium: { color: '#00d4ff', label: 'Medium' },
  low: { color: '#10b981', label: 'Low' },
};

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  const color = trend === 'up' ? '#ef4444' : trend === 'down' ? '#10b981' : '#f59e0b';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--color-elevated-15)', border: '1px solid var(--color-elevated-30)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-elevated)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-heading">Risk Prediction</h2>
          <p className="text-[10px] text-caption">Probability and severity forecasts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {risks.map((risk, i) => {
          const lvl = levelConfig[risk.level];
          const cardBg = 'var(--color-card)';
          const cardBorder = 'var(--color-border)';
          return (
            <motion.div
              key={risk.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl p-4"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-heading">{risk.title}</span>
                <div className="flex items-center gap-2">
                  <TrendArrow trend={risk.trend} />
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{
                    background: `${lvl.color}15`,
                    border: `1px solid ${lvl.color}30`,
                    color: lvl.color,
                  }}>
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
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${risk.probability}%` }}
                  transition={{ duration: 1, delay: 0.4 + i * 0.1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${lvl.color}60, ${lvl.color})`,
                    boxShadow: `0 0 8px ${lvl.color}40`,
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
