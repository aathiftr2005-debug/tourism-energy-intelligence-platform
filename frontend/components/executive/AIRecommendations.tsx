'use client';

import { motion } from 'framer-motion';
import { EmergencyService } from '@/lib/services';
import ExecutiveCard from '@/components/design-system/ExecutiveCard';

const recommendations = EmergencyService.getRecommendations();

const priorityColors: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: 'var(--color-critical)', bg: 'var(--color-critical-15)', border: 'var(--color-critical-30)' },
  high: { color: 'var(--color-elevated)', bg: 'var(--color-elevated-15)', border: 'var(--color-elevated-30)' },
  medium: { color: 'var(--color-accent)', bg: 'var(--color-accent-8)', border: 'var(--color-accent-20)' },
  low: { color: 'var(--color-normal)', bg: 'var(--color-normal-15)', border: 'var(--color-normal-30)' },
};

export default function AIRecommendations() {
  return (
    <ExecutiveCard
      title="AI Recommendations"
      subtitle="Intelligent actions based on current metrics"
      icon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      }
    >
      <div className="space-y-3">
        {recommendations.map((rec, i) => {
          const colors = priorityColors[rec.priority];
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl p-4 transition-all hover:scale-[1.01]"
              style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-xs font-semibold text-heading">{rec.title}</h3>
                <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.color }}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-xs leading-relaxed mb-2 text-body">{rec.description}</p>
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-normal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span className="text-[10px]" style={{ color: 'var(--color-normal)' }}>{rec.impact}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </ExecutiveCard>
  );
}
