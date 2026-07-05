'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import ComparisonCard from '@/components/cards/ComparisonCard';
import LeaderboardCard from '@/components/cards/LeaderboardCard';
import { CountryService, EnergyService } from '@/lib/services';
import { useTheme } from '@/lib/theme/ThemeContext';
import { getChartColors, getStressColor } from '@/lib/theme/chartColors';

const countries = CountryService.getStressPageCountries().map((c) => {
  const ss = EnergyService.getStressScore(c.code);
  return {
    code: c.code,
    name: c.name,
    level: ss?.level || 'NORMAL',
    score: ss?.score || 0,
  };
});

function levelColor(level: string, isDark: boolean): string {
  if (level === 'CRITICAL') return isDark ? '#ef4444' : '#DC2626';
  if (level === 'ELEVATED') return isDark ? '#f59e0b' : '#D97706';
  return isDark ? '#10b981' : '#059669';
}

function levelGlow(level: string, isDark: boolean): string {
  if (level === 'CRITICAL') return `0 0 30px ${isDark ? 'rgba(239,68,68,0.25)' : 'rgba(220,38,38,0.15)'}`;
  if (level === 'ELEVATED') return `0 0 25px ${isDark ? 'rgba(245,158,11,0.2)' : 'rgba(215,118,6,0.12)'}`;
  return `0 0 20px ${isDark ? 'rgba(16,185,129,0.15)' : 'rgba(5,150,105,0.1)'}`;
}

function getDescription(level: string): string {
  if (level === 'CRITICAL') return 'Critical situation. Immediate attention required.';
  if (level === 'ELEVATED') return 'High energy stress. Monitor closely.';
  return 'Within normal range.';
}

function StressGauge({ score, level, isDark }: { score: number; level: string; isDark: boolean }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const percent = score;
  const offset = circumference - (percent / 100) * circumference;
  const [animatedOffset, setAnimatedOffset] = useState(circumference);
  const color = levelColor(level, isDark);
  const colors = getChartColors(isDark);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedOffset(offset), 300);
    return () => clearTimeout(timer);
  }, [score, offset]);

  return (
    <div className="relative flex items-center justify-center my-3">
      <svg width="120" height="120" className="transform -rotate-90 drop-shadow-lg">
        <circle cx="60" cy="60" r={radius} fill="none" stroke={colors.track} strokeWidth="10" />
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          style={{
            filter: `drop-shadow(0 0 10px ${color}50)`,
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold tracking-tight" style={{ color, textShadow: levelGlow(level, isDark) }}>
          {score.toFixed(0)}
        </span>
        <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-caption">
          {level}
        </span>
      </div>
    </div>
  );
}

function levelBadge(level: string, isDark: boolean) {
  const color = levelColor(level, isDark);
  return (
    <span
      className="inline-block text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border"
      style={{
        color,
        borderColor: `${color}40`,
        background: `${color}12`,
        boxShadow: `0 0 12px ${color}15`,
      }}
    >
      {level}
    </span>
  );
}

export default function StressPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getChartColors(isDark);
  const [compareA, setCompareA] = useState('DE');
  const [compareB, setCompareB] = useState('FR');

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Stress Scores</h1>
        <p className="page-subtitle">Real-time energy stress monitoring across Europe</p>
        <span className="text-xs text-caption">
          {new Date().toLocaleString('en', { month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        {countries.map((c, i) => (
          <motion.div
            key={c.code}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 * i }}
            className="group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 hover:scale-[1.04] hover:shadow-[0_0_50px_rgba(0,212,255,0.12)]"
            style={{
              border: `1px solid ${levelColor(c.level, isDark)}25`,
            }}
            whileHover={{ borderColor: `${levelColor(c.level, isDark)}60` }}
          >
            <div className="absolute inset-0 w-full h-full">
              <Image
                src={CountryService.getFlagPath(c.code)}
                alt=""
                fill
                className="object-cover scale-110 group-hover:scale-125 transition-transform duration-700 opacity-20 group-hover:opacity-30 blur-sm"
              />
            </div>

            <div
              className="absolute inset-0"
              style={{
                background: isDark
                  ? 'linear-gradient(180deg, rgba(10,14,26,0.3) 0%, rgba(10,14,26,0.75) 50%, rgba(10,14,26,0.92) 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.95) 100%)',
                backdropFilter: 'blur(2px)',
              }}
            />

            <div className="relative z-10 p-5 flex flex-col">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-6 rounded-lg overflow-hidden border border-white/15 bg-white/5 backdrop-blur-sm flex items-center justify-center shadow-md flex-shrink-0 relative">
                  <Image
                    src={CountryService.getFlagPath(c.code)}
                    alt={c.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-heading block leading-tight truncate">{c.name}</span>
                  <span className="text-[10px] font-medium tracking-wider text-caption">{c.code}</span>
                </div>
              </div>

              <StressGauge score={c.score} level={c.level} isDark={isDark} />

              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm border text-muted" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)' }}>Tourist</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm border text-muted" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)' }}>Energy</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm border text-muted" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)' }}>Weather</span>
              </div>

              <div className="mt-3">{levelBadge(c.level, isDark)}</div>

              <p className="mt-2 text-xs leading-relaxed text-body">
                {getDescription(c.level)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card">
        <h2 className="section-title">Country Comparison</h2>
        <p className="text-caption text-xs mb-4">Compare energy stress metrics between two countries</p>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">Country A</span>
            <select
              value={compareA}
              onChange={(e) => setCompareA(e.target.value)}
              className="glass-select w-full sm:min-w-[160px]"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">Country B</span>
            <select
              value={compareB}
              onChange={(e) => setCompareB(e.target.value)}
              className="glass-select w-full sm:min-w-[160px]"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ComparisonCard
            country={compareA}
            stressScore={countries.find((c) => c.code === compareA)?.score || 0}
            forecast={(countries.find((c) => c.code === compareA)?.score || 0) + 3.5}
            trend={compareA === 'ES' || compareA === 'GR' || compareA === 'IT' ? 'up' : compareA === 'NL' || compareA === 'AT' ? 'down' : 'stable'}
            confidence={compareA === 'DE' || compareA === 'FR' ? 94.2 : compareA === 'ES' || compareA === 'IT' ? 96.8 : 91.5}
            riskFactors={{
              tourist_intensity: countries.find((c) => c.code === compareA)?.level === 'CRITICAL' ? 0.82 : countries.find((c) => c.code === compareA)?.level === 'ELEVATED' ? 0.61 : 0.28,
              flight_to_tourist_ratio: countries.find((c) => c.code === compareA)?.level === 'CRITICAL' ? 0.75 : countries.find((c) => c.code === compareA)?.level === 'ELEVATED' ? 0.55 : 0.22,
              temp_energy_interaction: countries.find((c) => c.code === compareA)?.level === 'CRITICAL' ? 0.78 : countries.find((c) => c.code === compareA)?.level === 'ELEVATED' ? 0.58 : 0.25,
              forecast_delta: countries.find((c) => c.code === compareA)?.level === 'CRITICAL' ? 0.71 : countries.find((c) => c.code === compareA)?.level === 'ELEVATED' ? 0.52 : 0.20,
            }}
            recommendation={countries.find((c) => c.code === compareA)?.level === 'CRITICAL'
              ? 'Activate emergency energy reserves. Alert regional grid operators. Consider demand-side management measures.'
              : countries.find((c) => c.code === compareA)?.level === 'ELEVATED'
              ? 'Prepare 15-20% reserve capacity. Monitor flight arrivals and tourist data daily. Pre-cool buildings during off-peak hours.'
              : 'Standard monitoring sufficient. Energy demand within expected range.'
            }
          />
          <ComparisonCard
            country={compareB}
            stressScore={countries.find((c) => c.code === compareB)?.score || 0}
            forecast={(countries.find((c) => c.code === compareB)?.score || 0) + 3.5}
            trend={compareB === 'ES' || compareB === 'GR' || compareB === 'IT' ? 'up' : compareB === 'NL' || compareB === 'AT' ? 'down' : 'stable'}
            confidence={compareB === 'DE' || compareB === 'FR' ? 94.2 : compareB === 'ES' || compareB === 'IT' ? 96.8 : 91.5}
            riskFactors={{
              tourist_intensity: countries.find((c) => c.code === compareB)?.level === 'CRITICAL' ? 0.82 : countries.find((c) => c.code === compareB)?.level === 'ELEVATED' ? 0.61 : 0.28,
              flight_to_tourist_ratio: countries.find((c) => c.code === compareB)?.level === 'CRITICAL' ? 0.75 : countries.find((c) => c.code === compareB)?.level === 'ELEVATED' ? 0.55 : 0.22,
              temp_energy_interaction: countries.find((c) => c.code === compareB)?.level === 'CRITICAL' ? 0.78 : countries.find((c) => c.code === compareB)?.level === 'ELEVATED' ? 0.58 : 0.25,
              forecast_delta: countries.find((c) => c.code === compareB)?.level === 'CRITICAL' ? 0.71 : countries.find((c) => c.code === compareB)?.level === 'ELEVATED' ? 0.52 : 0.20,
            }}
            recommendation={countries.find((c) => c.code === compareB)?.level === 'CRITICAL'
              ? 'Activate emergency energy reserves. Alert regional grid operators. Consider demand-side management measures.'
              : countries.find((c) => c.code === compareB)?.level === 'ELEVATED'
              ? 'Prepare 15-20% reserve capacity. Monitor flight arrivals and tourist data daily. Pre-cool buildings during off-peak hours.'
              : 'Standard monitoring sufficient. Energy demand within expected range.'
            }
          />
        </div>
      </div>

      <div className="glass-card">
        <h2 className="section-title">Top Risk Countries</h2>
        <p className="text-caption text-xs mb-4">Animated leaderboard of energy stress rankings</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <LeaderboardCard
            title="Highest Stress"
            subtitle="Current top risk countries"
            accentColor="#ef4444"
            valueLabel="Stress Score (0-100)"
            entries={[...countries]
              .sort((a, b) => b.score - a.score)
              .slice(0, 5)
              .map((c, i) => ({
                rank: i + 1,
                country: c.name,
                countryCode: c.code,
                value: c.score,
              }))
            }
          />
          <LeaderboardCard
            title="Fastest Rising"
            subtitle="Sharpest stress increase"
            accentColor="#f59e0b"
            valueLabel="Change"
            entries={[...countries]
              .sort((a, b) => {
                const aScore = a.level === 'CRITICAL' ? 5 : a.level === 'ELEVATED' ? 3 : 1;
                const bScore = b.level === 'CRITICAL' ? 5 : b.level === 'ELEVATED' ? 3 : 1;
                return bScore - aScore;
              })
              .slice(0, 5)
              .map((c, i) => ({
                rank: i + 1,
                country: c.name,
                countryCode: c.code,
                value: c.score,
                change: c.level === 'CRITICAL' ? 4.2 + i * 0.3 : c.level === 'ELEVATED' ? 2.1 + i * 0.2 : 0.5 + i * 0.1,
              }))
            }
          />
          <LeaderboardCard
            title="Most Improved"
            subtitle="Countries with declining stress"
            accentColor="#10b981"
            valueLabel="Improvement"
            entries={[...countries]
              .filter((c) => c.level === 'NORMAL')
              .sort((a, b) => a.score - b.score)
              .slice(0, 5)
              .map((c, i) => ({
                rank: i + 1,
                country: c.name,
                countryCode: c.code,
                value: c.score,
                change: -1.2 - i * 0.4,
              }))
            }
          />
          <LeaderboardCard
            title="Lowest Stress"
            subtitle="Best performing countries"
            accentColor="#00d4ff"
            valueLabel="Stress Score (0-100)"
            entries={[...countries]
              .sort((a, b) => a.score - b.score)
              .slice(0, 5)
              .map((c, i) => ({
                rank: i + 1,
                country: c.name,
                countryCode: c.code,
                value: c.score,
              }))
            }
          />
        </div>
      </div>
    </div>
  );
}
