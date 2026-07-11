'use client';

import { motion } from 'framer-motion';
import type { ExecutiveSummaryData } from '@/lib/types';
import data from '@/data/executive.json';
import { useTheme } from '@/lib/theme/ThemeContext';
import { getChartColors } from '@/lib/theme/chartColors';

const summaryData = data.summary as ExecutiveSummaryData;
const currentStatus = data.summary.currentStatus || 'moderate';

const statusColors: Record<string, string> = {
  optimal: '#10b981',
  moderate: '#f59e0b',
  critical: '#ef4444',
};

export default function ExecutiveSummary() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getChartColors(isDark);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card-accent overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-[0.03] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />

      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--color-accent-8)', border: '1px solid var(--color-accent-20)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-heading">Executive Summary</h2>
          <p className="text-[10px] text-caption">AI-generated operational overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        <div className="rounded-xl p-4 flex flex-col items-center justify-center"
          style={{ background: 'var(--color-card-hover)', border: '1px solid var(--color-border)' }}>
          <div className="relative w-16 h-16 mb-2">
            <svg width="64" height="64" viewBox="0 0 64 64" className="transform -rotate-90">
              <circle cx="32" cy="32" r="28" fill="none" stroke={colors.track} strokeWidth="4" />
              <circle cx="32" cy="32" r="28" fill="none" stroke={statusColors[currentStatus]} strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={175.93}
                strokeDashoffset={175.93 - (175.93 * summaryData.health) / 100}
                style={{ transition: 'stroke-dashoffset 1.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold" style={{ color: statusColors[currentStatus] }}>
                {summaryData.health}%
              </span>
            </div>
          </div>
          <span className="text-[10px] font-medium text-muted">System Health</span>
        </div>

        {[
          { label: 'Energy Status', value: summaryData.energyStatus, icon: '\u26a1' },
          { label: 'Tourism Activity', value: summaryData.tourismActivity, icon: '\ud83c\udf0d' },
          { label: 'Overall Risk', value: 'Moderate', icon: '\u2696\ufe0f', color: '#f59e0b' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl p-4 flex flex-col items-center justify-center text-center"
            style={{ background: 'var(--color-card-hover)', border: '1px solid var(--color-border)' }}>
            <span className="text-lg mb-1">{item.icon}</span>
            <span className="text-[10px] uppercase tracking-wider font-medium mb-1 text-caption">
              {item.label}
            </span>
            <span className="text-xs font-semibold leading-tight text-body" style={{ color: item.color || undefined }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4 text-xs leading-relaxed"
        style={{ background: 'var(--color-accent-5)', border: '1px solid var(--color-accent-8)' }}>
        <div className="flex items-center gap-2 mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-accent opacity-60">
            AI Operational Summary
          </span>
        </div>
        <p className="text-body">{summaryData.summary}</p>
      </div>
    </motion.div>
  );
}
