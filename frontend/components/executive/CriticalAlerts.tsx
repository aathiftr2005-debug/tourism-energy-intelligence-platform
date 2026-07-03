'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmergencyService } from '@/lib/services';

const alerts = EmergencyService.getSortedAlerts();

const priorityConfig = {
  high: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: '\u26a0\ufe0f', label: 'High Priority' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: '\u26a1', label: 'Medium Priority' },
  low: { color: '#00d4ff', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.2)', icon: '\u2139\ufe0f', label: 'Low Priority' },
};

function getAlertIconSvg(priority: 'high' | 'medium' | 'low') {
  switch (priority) {
    case 'high':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'medium':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
        </svg>
      );
    case 'low':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
}

export default function CriticalAlerts() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedAlerts = [...alerts].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const counts = {
    high: alerts.filter((a) => a.priority === 'high').length,
    medium: alerts.filter((a) => a.priority === 'medium').length,
    low: alerts.filter((a) => a.priority === 'low').length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: '#f0f0ff' }}>Critical Alerts</h2>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Priority-based operational notifications</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(['high', 'medium', 'low'] as const).map((p) => (
            <div key={p} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: priorityConfig[p].color }} />
              <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {counts[p]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {sortedAlerts.map((alert, i) => {
          const cfg = priorityConfig[alert.priority];
          const isExpanded = expanded === alert.id;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl overflow-hidden cursor-pointer transition-all"
              style={{
                background: isExpanded ? cfg.bg : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isExpanded ? cfg.border : 'rgba(255,255,255,0.05)'}`,
              }}
              onClick={() => setExpanded(isExpanded ? null : alert.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(isExpanded ? null : alert.id); } }}
              aria-expanded={isExpanded}
            >
              <div className="flex items-start gap-3 p-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIconSvg(alert.priority)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate" style={{ color: cfg.color }}>
                      {alert.title}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        color: cfg.color,
                      }}>
                        {cfg.label}
                      </span>
                      <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: `rotate(${isExpanded ? 180 : 0}deg)`, transition: 'transform 0.2s ease' }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{alert.timestamp}</span>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-0">
                      <div className="h-px w-full mb-2" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {alert.description}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
