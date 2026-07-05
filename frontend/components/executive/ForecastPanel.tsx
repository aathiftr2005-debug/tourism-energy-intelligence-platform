'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ForecastItem } from '@/lib/types';
import data from '@/data/executive.json';

const forecast24h = data.forecast24h as ForecastItem[];
const forecast7d = data.forecast7d as ForecastItem[];
const confidence = data.confidence;

function TrendIcon({ direction }: { direction: 'up' | 'down' | 'stable' }) {
  const color = direction === 'up' ? '#ef4444' : direction === 'down' ? '#10b981' : '#f59e0b';
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
  const data = tab === '24h' ? forecast24h : forecast7d;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-heading">Forecast</h2>
            <p className="text-[10px] text-caption">Short-term energy and tourism predictions</p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg p-0.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {(['24h', '7d'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${tab === t ? '' : 'text-muted'}`}
              style={{
                background: tab === t ? 'rgba(0,212,255,0.12)' : 'transparent',
                color: tab === t ? '#00d4ff' : undefined,
              }}
            >
              Next {t === '24h' ? '24 Hours' : '7 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-medium text-caption">
                {item.label}
              </span>
              <TrendIcon direction={item.direction} />
            </div>
            <p className="text-heading text-lg font-bold">{item.value}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] font-semibold" style={{
                color: item.direction === 'up' ? '#ef4444' : item.direction === 'down' ? '#10b981' : '#f59e0b',
              }}>
                {item.change}
              </span>
              <span className="text-[9px] text-caption">
                vs previous period
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 rounded-xl p-3 flex items-center justify-between"
        style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)' }}>
        <span className="text-[10px] text-accent/60">
          AI Confidence: {confidence}%
        </span>
        <span className="text-[10px] text-muted">
          Updated {new Date().toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
}
