'use client';

import { motion } from 'framer-motion';
import { COUNTRY_FLAGS, COUNTRY_NAMES } from '@/lib/types';
import { useTheme } from '@/lib/theme/ThemeContext';
import { getChartColors } from '@/lib/theme/chartColors';

interface ComparisonCardProps {
  country: string;
  stressScore: number;
  forecast: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  riskFactors: Record<string, number>;
  recommendation: string;
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#ef4444';
  if (score >= 50) return '#f59e0b';
  if (score >= 30) return '#eab308';
  return '#10b981';
}

function getTrendIcon(trend: string): { icon: string; color: string } {
  switch (trend) {
    case 'up': return { icon: '\u2191', color: '#ef4444' };
    case 'down': return { icon: '\u2193', color: '#10b981' };
    default: return { icon: '\u2192', color: '#f59e0b' };
  }
}

function getRiskFactorLabel(key: string): string {
  const labels: Record<string, string> = {
    tourist_intensity: 'Tourism',
    flight_to_tourist_ratio: 'Flights',
    temp_energy_interaction: 'Weather',
    forecast_delta: 'Energy Demand',
  };
  return labels[key] || key;
}

function getRiskFactorColor(value: number): string {
  if (value >= 0.7) return '#ef4444';
  if (value >= 0.5) return '#f59e0b';
  return '#10b981';
}

export default function ComparisonCard({
  country, stressScore, forecast, trend,
  confidence, riskFactors, recommendation,
}: ComparisonCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getChartColors(isDark);
  const scoreColor = getScoreColor(stressScore);
  const trendInfo = getTrendIcon(trend);

  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const trackBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: cardBg,
        backdropFilter: 'blur(16px)',
        border: `1px solid ${cardBorder}`,
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">{COUNTRY_FLAGS[country] || ''}</span>
        <div>
          <h3 className="text-heading text-base font-semibold">{COUNTRY_NAMES[country] || country}</h3>
          <span className="text-caption text-[10px] font-medium tracking-wider">{country}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl p-3 text-center" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <p className="text-caption text-[10px] uppercase tracking-wider mb-1">Current Stress</p>
          <p className="text-2xl font-bold" style={{ color: scoreColor, textShadow: `0 0 15px ${scoreColor}30` }}>{stressScore.toFixed(1)}</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <p className="text-caption text-[10px] uppercase tracking-wider mb-1">Forecast</p>
          <p className="text-heading text-2xl font-bold">{forecast.toFixed(1)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl p-3 text-center" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <p className="text-caption text-[10px] uppercase tracking-wider mb-1">Trend</p>
          <p className="text-xl font-bold" style={{ color: trendInfo.color }}>
            {trendInfo.icon} {trend === 'up' ? 'Rising' : trend === 'down' ? 'Falling' : 'Stable'}
          </p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <p className="text-caption text-[10px] uppercase tracking-wider mb-1">Confidence</p>
          <p className="text-xl font-bold" style={{ color: confidence >= 90 ? '#10b981' : confidence >= 75 ? '#f59e0b' : '#ef4444' }}>{confidence.toFixed(0)}%</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-caption text-[10px] uppercase tracking-wider mb-2">Risk Factors</p>
        <div className="space-y-2">
          {Object.entries(riskFactors).map(([key, value]) => {
            const pct = value * 100;
            const color = getRiskFactorColor(value);
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted text-xs">{getRiskFactorLabel(key)}</span>
                  <span className="text-xs font-mono" style={{ color }}>{pct.toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: trackBg }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}60, ${color})` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl p-3" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
        <p className="text-caption text-[10px] uppercase tracking-wider mb-1">AI Recommendation</p>
        <p className="text-body text-xs leading-relaxed">{recommendation}</p>
      </div>
    </motion.div>
  );
}
