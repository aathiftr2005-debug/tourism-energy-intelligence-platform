'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import EuropeMap from '@/components/maps/EuropeMap';
import { DigitalTwinMap } from '@/components/maps/digital-twin';
import { CountryService } from '@/lib/services';

const MOCK_DATA = CountryService.getMapStressScores();
const FLAGS = CountryService.getAll().emojiFlags;

const TIMELINE_LABELS = ['Current', '+3 Months', '+6 Months', '+12 Months'];

function getScoreColor(score: number): string {
  if (score >= 70) return '#ef4444';
  if (score >= 50) return '#f59e0b';
  if (score >= 30) return '#eab308';
  return '#10b981';
}

function getScoreGlow(score: number): string {
  if (score >= 70) return '0 0 25px rgba(239,68,68,0.3)';
  if (score >= 50) return '0 0 20px rgba(245,158,11,0.2)';
  if (score >= 30) return '0 0 15px rgba(234,179,8,0.15)';
  return '0 0 12px rgba(16,185,129,0.12)';
}

function getTrend(score: number, country: string): 'up' | 'down' | 'stable' {
  const rising = ['ES', 'GR', 'IT', 'FR', 'HU'];
  const falling = ['NL', 'AT', 'CH', 'NO', 'FI'];
  if (rising.includes(country)) return 'up';
  if (falling.includes(country)) return 'down';
  return 'stable';
}

function getConfidence(score: number): number {
  if (score >= 70) return 96.8;
  if (score >= 50) return 94.2;
  if (score >= 30) return 91.5;
  return 88.3;
}

function getTimelineAdjusted(baseScore: number, timelineIndex: number): number {
  const multipliers = [1.0, 1.08, 1.15, 1.22];
  return Math.min(Math.round(baseScore * multipliers[timelineIndex]), 100);
}

function getRiskFactorWeather(score: number): number {
  if (score >= 70) return 0.72 + Math.random() * 0.08;
  if (score >= 50) return 0.52 + Math.random() * 0.08;
  if (score >= 30) return 0.28 + Math.random() * 0.08;
  return 0.12 + Math.random() * 0.08;
}

function getRiskFactorTourism(score: number): number {
  if (score >= 70) return 0.78 + Math.random() * 0.08;
  if (score >= 50) return 0.58 + Math.random() * 0.08;
  if (score >= 30) return 0.32 + Math.random() * 0.08;
  return 0.15 + Math.random() * 0.08;
}

function getRiskFactorFlights(score: number): number {
  if (score >= 70) return 0.68 + Math.random() * 0.08;
  if (score >= 50) return 0.48 + Math.random() * 0.08;
  if (score >= 30) return 0.24 + Math.random() * 0.08;
  return 0.10 + Math.random() * 0.08;
}

function generateInsight(country: string, score: number, trend: string): string {
  const countryName = country;
  if (score >= 70) {
    return `${countryName} is experiencing critical energy stress driven by elevated tourism demand, high temperatures, and increased flight traffic. Immediate intervention is required to prevent grid instability.`;
  }
  if (score >= 50) {
    return `${countryName}'s projected energy stress is rising due to growing tourism inflows and seasonal temperature variations. Current conditions are elevated but remain manageable with proactive monitoring.`;
  }
  if (trend === 'up') {
    return `${countryName} shows early signs of increasing energy stress. Tourism and weather factors remain stable but should be watched as demand grows.`;
  }
  return `${countryName}'s energy conditions remain stable with low stress across all monitored factors. Standard operations are sufficient.`;
}

function generateRecommendation(score: number): string {
  if (score >= 70) {
    return 'Activate emergency energy reserves. Alert regional grid operators. Consider demand-side management measures and public awareness campaigns.';
  }
  if (score >= 50) {
    return 'Prepare 15-20% reserve capacity. Monitor flight arrivals and tourist accommodation data daily. Pre-cool buildings during off-peak hours.';
  }
  return 'Standard monitoring sufficient. Energy demand within expected range. Run next routine update.';
}

export default function MapPage() {
  const [data, setData] = useState(MOCK_DATA);
  const [selectedCountry, setSelectedCountry] = useState<{ country: string; country_code?: string; stress_score: number; status?: string } | null>(null);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'stress' | 'digital-twin'>('stress');

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('http://localhost:8000/api/v1/stress/all');
        const result = await response.json();
        if (result && Array.isArray(result) && result.length > 0) {
          setData(result);
        }
      } catch {
        console.log('Using mock data');
      }
    }
    fetchData();
  }, []);

  const handleCountryClick = (country: { country: string; country_code?: string; stress_score: number; status?: string }) => {
    setSelectedCountry(country);
  };

  const closePanel = () => {
    setSelectedCountry(null);
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <Image src="/images/map-bg.jpg" alt="" aria-hidden="true" fill className="object-cover opacity-[0.05]" />
        <div className="absolute inset-0" style={{ background: 'var(--color-overlay)' }} />
      </div>

      <div className="glass-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <div className="min-w-0 break-words">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-600 bg-clip-text text-transparent break-words">
              {viewMode === 'stress' ? 'Europe Stress Map' : 'Digital Twin Monitor'}
            </h1>
            <p className="text-muted mt-1 text-sm md:text-base break-words">
              {viewMode === 'stress'
                ? 'Interactive map showing real-time stress scores across Europe'
                : 'Layer-based digital twin visualization with AI-powered insights'}
            </p>
          </div>
          <div className="flex items-center gap-2 p-1 rounded-2xl flex-shrink-0" style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
          }}>
            {(['stress', 'digital-twin'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-semibold transition-all tracking-wider uppercase ${viewMode === mode ? 'text-accent' : 'text-muted'}`}
                style={{
                  background: viewMode === mode ? 'var(--color-accent-8)' : 'transparent',
                  border: `1px solid ${viewMode === mode ? 'var(--color-accent-20)' : 'transparent'}`,
                }}
              >
                {mode === 'stress' ? 'Stress Map' : 'Digital Twin'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="glass-card p-4 h-[400px] md:h-[600px]">
            {viewMode === 'stress' ? (
              <EuropeMap
                data={data}
                onCountryClick={handleCountryClick}
                timelineIndex={timelineIndex}
              />
            ) : (
              <DigitalTwinMap />
            )}
          </div>
        </div>

        <AnimatePresence>
          {selectedCountry && (
            <motion.div
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="overflow-hidden flex-shrink-0 w-full md:w-[360px]"
            >
              <div
                className="rounded-2xl p-5 h-full overflow-y-auto"
                style={{
                  background: 'var(--color-card)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--light-card-shadow-md)',
                  width: '100%', maxWidth: 360,
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{FLAGS[selectedCountry.country_code || ''] || ''}</span>
                    <div>
                      <h2 className="text-heading text-base font-bold">{selectedCountry.country}</h2>
                      <span className="text-caption text-[10px] font-medium tracking-wider">{selectedCountry.country_code}</span>
                    </div>
                  </div>
                  <button
                    onClick={closePanel}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all text-muted"
                    style={{ background: 'var(--color-card-hover)', border: '1px solid var(--color-border)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-critical-15)'; e.currentTarget.style.borderColor = 'var(--color-critical-30)'; e.currentTarget.style.color = 'var(--color-critical)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-card-hover)'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = ''; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>

                <div className="flex items-center justify-center py-4 mb-4 rounded-xl" style={{
                  background: 'var(--color-card-hover)', border: '1px solid var(--color-border)',
                }}>
                  <div className="text-center">
                    <p className="text-caption text-[10px] uppercase tracking-wider mb-1">Stress Score</p>
                    <motion.p
                      key={timelineIndex}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-5xl font-extrabold"
                      style={{ color: getScoreColor(getTimelineAdjusted(selectedCountry.stress_score, timelineIndex)), textShadow: getScoreGlow(getTimelineAdjusted(selectedCountry.stress_score, timelineIndex)) }}
                    >
                      {getTimelineAdjusted(selectedCountry.stress_score, timelineIndex)}
                    </motion.p>
                    <span className="text-[11px] px-3 py-1 rounded-full font-semibold mt-2 inline-block" style={{
                      background: `${getScoreColor(selectedCountry.stress_score)}15`,
                      border: `1px solid ${getScoreColor(selectedCountry.stress_score)}30`,
                      color: getScoreColor(selectedCountry.stress_score),
                    }}>
                      {selectedCountry.stress_score >= 70 ? 'CRITICAL' : selectedCountry.stress_score >= 50 ? 'ELEVATED' : selectedCountry.stress_score >= 30 ? 'MODERATE' : 'NORMAL'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    {
                      label: 'Forecast',
                      value: getTimelineAdjusted(selectedCountry.stress_score, timelineIndex + 1 > 3 ? 3 : timelineIndex + 1),
                      color: getScoreColor(getTimelineAdjusted(selectedCountry.stress_score, timelineIndex + 1 > 3 ? 3 : timelineIndex + 1)),
                    },
                    {
                      label: 'Trend',
                      value: getTrend(selectedCountry.stress_score, selectedCountry.country_code || ''),
                      color: getTrend(selectedCountry.stress_score, selectedCountry.country_code || '') === 'up' ? '#ef4444' : getTrend(selectedCountry.stress_score, selectedCountry.country_code || '') === 'down' ? '#10b981' : '#f59e0b',
                    },
                    {
                      label: 'Confidence',
                      value: `${getConfidence(selectedCountry.stress_score).toFixed(0)}%`,
                      color: getConfidence(selectedCountry.stress_score) >= 95 ? '#10b981' : getConfidence(selectedCountry.stress_score) >= 90 ? '#f59e0b' : '#eab308',
                    },
                    {
                      label: 'Status',
                      value: selectedCountry.status || 'N/A',
                      color: getScoreColor(selectedCountry.stress_score),
                    },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: 'var(--color-card-hover)', border: '1px solid var(--color-border)' }}>
                      <p className="text-caption text-[10px] uppercase tracking-wider mb-1">{item.label}</p>
                      <p className="text-lg font-bold" style={{ color: item.color }}>
                        {item.label === 'Trend' ? (
                          <span>{item.value === 'up' ? '\u2191 Rising' : item.value === 'down' ? '\u2193 Falling' : '\u2192 Stable'}</span>
                        ) : (
                          item.value
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <p className="text-caption text-[10px] uppercase tracking-wider mb-3">Risk Factors</p>
                  {[
                    { label: 'Tourism', value: getRiskFactorTourism(selectedCountry.stress_score), key: 'tourism' },
                    { label: 'Weather', value: getRiskFactorWeather(selectedCountry.stress_score), key: 'weather' },
                    { label: 'Flights', value: getRiskFactorFlights(selectedCountry.stress_score), key: 'flights' },
                    { label: 'Energy Demand', value: selectedCountry.stress_score / 100, key: 'energy' },
                  ].map((factor) => {
                    const pct = Math.round(factor.value * 100);
                    const color = pct >= 70 ? '#ef4444' : pct >= 50 ? '#f59e0b' : pct >= 30 ? '#eab308' : '#10b981';
                    return (
                      <div key={factor.key} className="mb-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted">{factor.label}</span>
                          <span className="text-xs font-mono" style={{ color }}>{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${color}60, ${color})`, boxShadow: `0 0 8px ${color}40` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mb-4 rounded-xl p-3" style={{ background: 'var(--color-accent-5)', border: '1px solid var(--color-accent-8)' }}>
                  <p className="text-caption text-[10px] uppercase tracking-wider mb-1.5">AI Insight</p>
                  <p className="text-body text-xs leading-relaxed">
                    {generateInsight(selectedCountry.country_code || selectedCountry.country, selectedCountry.stress_score, getTrend(selectedCountry.stress_score, selectedCountry.country_code || ''))}
                  </p>
                </div>

                <div className="rounded-xl p-3" style={{ background: `${getScoreColor(selectedCountry.stress_score)}08`, border: `1px solid ${getScoreColor(selectedCountry.stress_score)}15` }}>
                  <p className="text-caption text-[10px] uppercase tracking-wider mb-1.5">AI Recommendation</p>
                  <p className="text-body text-xs leading-relaxed">
                    {generateRecommendation(selectedCountry.stress_score)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {viewMode === 'stress' && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setTimelineIndex(idx)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${timelineIndex === idx ? 'text-accent' : 'text-muted'}`}
                  style={{
                    background: timelineIndex === idx ? 'var(--color-accent-8)' : 'var(--color-card)',
                    border: `1px solid ${timelineIndex === idx ? 'var(--color-accent-20)' : 'var(--color-border)'}`,
                  }}
                >
                  {TIMELINE_LABELS[idx]}
                </button>
              ))}
            </div>

            <div className="text-caption text-[10px]">
              {TIMELINE_LABELS[timelineIndex]}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">{data.length}</div>
              <div className="text-muted text-sm">Countries</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-red-500">
                {data.filter(d => d.stress_score >= 70).length}
              </div>
              <div className="text-muted text-sm">Critical</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {data.filter(d => d.stress_score >= 50 && d.stress_score < 70).length}
              </div>
              <div className="text-muted text-sm">High</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {data.filter(d => d.stress_score < 30).length}
              </div>
              <div className="text-muted text-sm">Low</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
