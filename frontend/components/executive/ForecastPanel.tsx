'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { ForecastItem } from '@/lib/types';
import data from '@/data/executive.json';
import ExecutiveCard from '@/components/design-system/ExecutiveCard';

const forecast24h = data.forecast24h as ForecastItem[];
const forecast7d = data.forecast7d as ForecastItem[];
const confidence = data.confidence;

function TrendIcon({ direction }: { direction: 'up' | 'down' | 'stable' }) {
  const color = direction === 'up' ? 'var(--color-critical)' : direction === 'down' ? 'var(--color-normal)' : 'var(--color-elevated)';
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {direction === 'up' && <polyline points="18 15 12 9 6 15" />}
      {direction === 'down' && <polyline points="6 9 12 15 18 9" />}
      {direction === 'stable' && <line x1="5" y1="12" x2="19" y2="12" />}
    </svg>
  );
}

export default function ForecastPanel() {
  const [tab, setTab] = useState<'24h' | '7d'>('24h');
  const [time, setTime] = useState('');
  const forecastData = tab === '24h' ? forecast24h : forecast7d;

  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
  }, []);

  return (
    <ExecutiveCard
      title="Forecast"
      subtitle="Short-term energy and tourism predictions"
      icon={
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-normal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      }
    >
      <div className="flex items-center justify-end mb-5">
        <div className="flex items-center gap-1 rounded-lg p-0.5"
          style={{ background: 'var(--color-card-hover)', border: '1px solid var(--color-border)' }}>
          {(['24h', '7d'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${tab === t ? '' : 'text-muted'}`}
              style={{
                background: tab === t ? 'var(--color-accent-8)' : 'transparent',
                color: tab === t ? 'var(--color-accent)' : undefined,
                border: tab === t ? '1px solid var(--color-accent-20)' : '1px solid transparent',
              }}
            >
              Next {t === '24h' ? '24 Hours' : '7 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {forecastData.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl p-4"
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-medium text-caption">{item.label}</span>
              <TrendIcon direction={item.direction} />
            </div>
            <p className="text-heading text-lg font-bold">{item.value}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] font-semibold" style={{ color: item.direction === 'up' ? 'var(--color-critical)' : item.direction === 'down' ? 'var(--color-normal)' : 'var(--color-elevated)' }}>
                {item.change}
              </span>
              <span className="text-[9px] text-caption">vs previous period</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 rounded-xl p-3 flex items-center justify-between"
        style={{ background: 'var(--color-accent-5)', border: '1px solid var(--color-accent-8)' }}>
        <span className="text-[10px] text-accent/60">AI Confidence: {confidence}%</span>
        <span className="text-[10px] text-muted">Updated {time}</span>
      </div>
    </ExecutiveCard>
  );
}
