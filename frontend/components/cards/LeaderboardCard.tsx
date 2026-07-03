'use client';

import { motion } from 'framer-motion';
import { CountryService } from '@/lib/services';

interface LeaderboardEntry {
  rank: number;
  country: string;
  countryCode: string;
  value: number;
  change?: number;
}

interface LeaderboardCardProps {
  title: string;
  subtitle: string;
  entries: LeaderboardEntry[];
  valueLabel: string;
  accentColor: string;
}

const flagImages = CountryService.getAll().flags;

function getValueColor(value: number, accentColor: string): string {
  if (accentColor === '#10b981') {
    if (value >= 70) return '#ef4444';
    if (value >= 50) return '#f59e0b';
    if (value >= 30) return '#eab308';
    return '#10b981';
  }
  return accentColor;
}

function getChangeIcon(change: number | undefined): string {
  if (change === undefined) return '';
  if (change > 0) return '\u2191';
  if (change < 0) return '\u2193';
  return '\u2192';
}

function getChangeColor(change: number | undefined): string {
  if (change === undefined) return 'rgba(255,255,255,0.3)';
  if (change > 0) return '#ef4444';
  if (change < 0) return '#10b981';
  return '#f59e0b';
}

export default function LeaderboardCard({ title, subtitle, entries, valueLabel, accentColor }: LeaderboardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>{title}</h3>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{subtitle}</p>
        </div>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
          <span className="text-xs font-bold" style={{ color: accentColor }}>{entries.length}</span>
        </div>
      </div>

      <div className="space-y-2">
        {entries.map((entry, i) => {
          const valColor = getValueColor(entry.value, accentColor);
          return (
            <motion.div
              key={entry.countryCode}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="flex items-center gap-3 rounded-xl p-2.5 transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold flex-shrink-0"
                style={{
                  background: entry.rank <= 3 ? `${accentColor}20` : 'rgba(255,255,255,0.04)',
                  color: entry.rank <= 3 ? accentColor : 'rgba(255,255,255,0.3)',
                  border: `1px solid ${entry.rank <= 3 ? `${accentColor}40` : 'rgba(255,255,255,0.06)'}`,
                }}>
                {entry.rank}
              </div>

              <div className="w-7 h-5 rounded overflow-hidden flex-shrink-0 border border-white/10 bg-white/5">
                {flagImages[entry.countryCode] && (
                  <img src={flagImages[entry.countryCode]} alt={entry.country} className="w-full h-full object-cover" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{entry.country}</p>
              </div>

              {entry.change !== undefined && (
                <span className="text-[10px] font-mono mr-1" style={{ color: getChangeColor(entry.change) }}>
                  {getChangeIcon(entry.change)}{entry.change > 0 ? '+' : ''}{entry.change.toFixed(1)}
                </span>
              )}

              <span className="text-sm font-bold" style={{ color: valColor }}>
                {entry.value.toFixed(1)}
              </span>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {valueLabel}
        </span>
      </div>
    </motion.div>
  );
}
