'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { CountryService } from '@/lib/services';
import { useTheme } from '@/lib/theme/ThemeContext';
import { getChartColors } from '@/lib/theme/chartColors';
import { DashboardCard } from '@/components/design-system';

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
    if (value >= 70) return 'var(--color-critical)';
    if (value >= 50) return 'var(--color-elevated)';
    if (value >= 30) return 'var(--color-elevated)';
    return 'var(--color-normal)';
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
  if (change === undefined) return 'var(--color-text-muted)';
  if (change > 0) return 'var(--color-critical)';
  if (change < 0) return 'var(--color-normal)';
  return 'var(--color-elevated)';
}

export default function LeaderboardCard({ title, subtitle, entries, valueLabel, accentColor }: LeaderboardCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getChartColors(isDark);
  const cardBg = 'var(--color-card)';
  const cardBorder = 'var(--color-border)';
  const entryBg = 'var(--color-card-hover)';
  const entryBorder = 'var(--color-border)';

  return (
    <DashboardCard className="relative overflow-hidden p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-body text-sm font-semibold">{title}</h3>
          <p className="text-caption text-[10px] mt-0.5">{subtitle}</p>
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
              style={{ background: entryBg, border: `1px solid ${entryBorder}` }}
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold flex-shrink-0"
                style={{
                  background: entry.rank <= 3 ? `${accentColor}20` : 'var(--color-card-hover)',
                  color: entry.rank <= 3 ? accentColor : 'var(--color-text-caption)',
                  border: `1px solid ${entry.rank <= 3 ? `${accentColor}40` : 'var(--color-border)'}`,
                }}>
                {entry.rank}
              </div>

              <div className="w-7 h-5 rounded overflow-hidden flex-shrink-0 border bg-white/5 relative" style={{ borderColor: 'var(--color-border)' }}>
                {flagImages[entry.countryCode] && (
                  <Image src={flagImages[entry.countryCode]} alt={entry.country} fill sizes="28px" className="object-cover" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-heading text-xs font-medium truncate">{entry.country}</p>
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

      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <span className="text-disabled text-[10px] uppercase tracking-wider">
          {valueLabel}
        </span>
      </div>
    </DashboardCard>
  );
}
