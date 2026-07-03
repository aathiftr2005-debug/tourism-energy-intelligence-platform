'use client';

import { motion } from 'framer-motion';
import type { ExecutiveSummaryData } from '@/lib/types';
import data from '@/data/executive.json';

const summaryData = data.summary as ExecutiveSummaryData;
const currentStatus = data.summary.currentStatus || 'moderate';

const statusColors: Record<string, string> = {
  optimal: '#10b981',
  moderate: '#f59e0b',
  critical: '#ef4444',
};

export default function ExecutiveSummary() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card-accent overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-[0.03] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #00d4ff 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />

      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold" style={{ color: '#f0f0ff' }}>Executive Summary</h2>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>AI-generated operational overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        <div className="rounded-xl p-4 flex flex-col items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="relative w-16 h-16 mb-2">
            <svg width="64" height="64" viewBox="0 0 64 64" className="transform -rotate-90">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
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
          <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>System Health</span>
        </div>

        {[
          { label: 'Energy Status', value: summaryData.energyStatus, icon: '\u26a1' },
          { label: 'Tourism Activity', value: summaryData.tourismActivity, icon: '\ud83c\udf0d' },
          { label: 'Overall Risk', value: 'Moderate', icon: '\u2696\ufe0f', color: '#f59e0b' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl p-4 flex flex-col items-center justify-center text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-lg mb-1">{item.icon}</span>
            <span className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {item.label}
            </span>
            <span className="text-xs font-semibold leading-tight" style={{ color: item.color || 'rgba(255,255,255,0.7)' }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4 text-xs leading-relaxed"
        style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)' }}>
        <div className="flex items-center gap-2 mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(0,212,255,0.5)' }}>
            AI Operational Summary
          </span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.65)' }}>{summaryData.summary}</p>
      </div>
    </motion.div>
  );
}
