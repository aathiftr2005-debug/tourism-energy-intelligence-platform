'use client';

import { motion } from 'framer-motion';
import { EmergencyService } from '@/lib/services';

const recommendations = EmergencyService.getRecommendations();

const priorityColors: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  high: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  medium: { color: '#00d4ff', bg: 'rgba(0,212,255,0.12)', border: 'rgba(0,212,255,0.25)' },
  low: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
};

export default function AIRecommendations() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="glass-card"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-heading">AI Recommendations</h2>
          <p className="text-[10px] text-caption">Intelligent actions based on current metrics</p>
        </div>
      </div>

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
              <p className="text-xs leading-relaxed mb-2 text-body">
                {rec.description}
              </p>
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
    </motion.div>
  );
}
