'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface HealthItem {
  label: string;
  status: 'operational' | 'degraded' | 'down';
  value: string;
}

const statusConfig = {
  operational: { color: '#10b981', glow: '0 0 8px rgba(16,185,129,0.4)', label: 'Operational' },
  degraded: { color: '#f59e0b', glow: '0 0 8px rgba(245,158,11,0.4)', label: 'Degraded' },
  down: { color: '#ef4444', glow: '0 0 8px rgba(239,68,68,0.4)', label: 'Down' },
};

function HealthDot({ status }: { status: keyof typeof statusConfig }) {
  const cfg = statusConfig[status];
  return (
    <span
      className="w-2 h-2 rounded-full inline-block"
      style={{ background: cfg.color, boxShadow: cfg.glow }}
    />
  );
}

import data from '@/data/system.json';
import type { SystemHealthItem } from '@/lib/types';

export default function SystemHealth() {
  const items = data.healthItems as SystemHealthItem[];
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    const now = new Date();
    setLastUpdated(now.toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }));
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item, i) => {
          const cfg = statusConfig[item.status];
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                <HealthDot status={item.status} />
              </div>
              <p className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
              <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{item.value}</p>
            </motion.div>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.4)', animation: 'breathing-glow 2s ease-in-out infinite' }} />
        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          All systems operational &mdash; Last updated {lastUpdated}
        </span>
      </div>
    </div>
  );
}
