'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CountryService } from '@/lib/services';
import { useTheme } from '@/lib/theme/ThemeContext';
import { getChartColors } from '@/lib/theme/chartColors';

interface CountryData {
  country: string;
  country_code?: string;
  stress_score: number;
  status?: string;
}

interface EuropeMapProps {
  data: CountryData[];
  onCountryClick?: (country: CountryData) => void;
  timelineIndex?: number;
}

const FLAGS = CountryService.getAll().emojiFlags;
const COUNTRY_POSITIONS = CountryService.getPositions();

function getHeatColor(score: number): string {
  if (score >= 80) return '#ef4444';
  if (score >= 70) return '#f97316';
  if (score >= 60) return '#f59e0b';
  if (score >= 50) return '#eab308';
  if (score >= 40) return '#84cc16';
  if (score >= 30) return '#22c55e';
  return '#10b981';
}

function getHeatGlow(score: number): string {
  if (score >= 70) return `0 0 ${8 + (score - 70) * 0.4}px rgba(239,68,68,${0.3 + (score - 70) * 0.01})`;
  if (score >= 50) return `0 0 ${6 + (score - 50) * 0.2}px rgba(251,146,60,0.3)`;
  if (score >= 30) return `0 0 ${4 + (score - 30) * 0.15}px rgba(234,179,8,0.2)`;
  return '0 0 4px rgba(34,197,94,0.15)';
}

function getTimelineAdjustedScore(baseScore: number, timelineIndex: number): number {
  const multipliers = [1.0, 1.08, 1.15, 1.22];
  const b = baseScore ?? 0;
  const m = multipliers[timelineIndex] ?? 1.0;
  const adjusted = b * m;
  return Math.min(Math.round(adjusted), 100);
}

export default function EuropeMap({ data, onCountryClick, timelineIndex = 0 }: EuropeMapProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getChartColors(isDark);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [zoomedCountry, setZoomedCountry] = useState<string | null>(null);

  const countryDataMap = useMemo(() => {
    const map: Record<string, CountryData> = {};
    data.forEach((item) => { map[item.country] = item; });
    return map;
  }, [data]);

  const europePath = "M30,15 L35,10 L50,5 L65,8 L75,10 L80,15 L85,20 L80,30 L75,40 L70,50 L65,58 L60,60 L55,58 L50,55 L45,58 L40,55 L35,50 L30,45 L25,40 L28,30 L30,20 Z";

  const tooltipBg = 'var(--color-card)';
  const legendBg = 'var(--color-card)';
  const legendBorder = 'var(--color-border)';

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl">
      <div className="w-full h-full min-h-[300px] rounded-2xl overflow-hidden relative" style={{ background: 'var(--color-card-hover)' }}>

        <motion.svg
          viewBox="0 0 100 70"
          className="w-full h-full"
          style={{ background: 'transparent' }}
          animate={{ scale: zoomedCountry ? 1.15 : 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <path
            d={europePath}
            fill="var(--color-accent-5)"
            stroke="var(--color-accent-8)"
            strokeWidth="0.5"
          />

          {Object.entries(COUNTRY_POSITIONS).map(([country, pos]) => {
            const countryData = countryDataMap[country];
            const hasData = !!countryData;
            const baseScore = hasData ? countryData.stress_score : 0;
            const score = getTimelineAdjustedScore(baseScore, timelineIndex);
            const isHovered = hoveredCountry === country;
            const isZoomed = zoomedCountry === country;
            const size = isHovered ? 8 : isZoomed ? 10 : hasData ? 3 + (score / 100) * 5 : 2;

            return (
              <g
                key={country}
                onClick={() => {
                  setZoomedCountry(country);
                  onCountryClick?.(countryData || { country, stress_score: 0 });
                }}
                onMouseEnter={() => setHoveredCountry(country)}
                onMouseLeave={() => setHoveredCountry(null)}
                style={{ cursor: 'pointer' }}
              >
                {isHovered && (
                  <>
                    <circle cx={pos.x} cy={pos.y} r={size + 8} fill="var(--color-accent-5)" className="animate-ping" style={{ animationDuration: '2s' }} />
                    <circle cx={pos.x} cy={pos.y} r={size + 5} fill="var(--color-accent-8)" />
                  </>
                )}

                {isZoomed && (
                  <circle cx={pos.x} cy={pos.y} r={size + 10} fill="var(--color-accent-8)" className="animate-pulse" style={{ animationDuration: '1.5s' }} />
                )}

                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={size}
                  fill={hasData ? getHeatColor(score) : 'var(--color-card)'}
            stroke={isHovered || isZoomed ? 'var(--color-accent)' : hasData ? 'var(--color-border)' : 'var(--color-border)'}
            strokeWidth={isHovered || isZoomed ? 2 : 0.5}
                  animate={{ r: size, scale: isHovered ? 1.3 : 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{ filter: hasData ? `drop-shadow(${getHeatGlow(score)})` : 'none', transformOrigin: `${pos.x}px ${pos.y}px` }}
                />

                <AnimatePresence>
                  {isHovered && (
                    <motion.g
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <rect
                        x={pos.x - 18}
                        y={pos.y - 22}
                        width={36}
                        height={18}
                        rx={4}
                        fill="var(--color-card)"
                        stroke="var(--color-accent-20)"
                        strokeWidth="0.5"
                      />
                      <text x={pos.x} y={pos.y - 10} textAnchor="middle" fill="var(--color-text-heading)" fontSize="3.5" fontWeight="bold">
                        {pos.label}
                      </text>
                    </motion.g>
                  )}
                </AnimatePresence>
              </g>
            );
          })}
        </motion.svg>

        <AnimatePresence>
          {hoveredCountry && countryDataMap[hoveredCountry] && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="absolute top-4 right-4 p-3 rounded-2xl min-w-[140px] shadow-xl"
              style={{
                background: tooltipBg,
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--color-accent-20)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{FLAGS[countryDataMap[hoveredCountry].country_code || hoveredCountry.substring(0, 2).toUpperCase()] || ''}</span>
                <span className="text-xs font-semibold" style={{ color: colors.tooltip.text }}>{hoveredCountry}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold" style={{ color: getHeatColor(countryDataMap[hoveredCountry].stress_score) }}>
                  {getTimelineAdjustedScore(countryDataMap[hoveredCountry].stress_score, timelineIndex)}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{
                  background: `${getHeatColor(countryDataMap[hoveredCountry].stress_score)}18`,
                  border: `1px solid ${getHeatColor(countryDataMap[hoveredCountry].stress_score)}30`,
                  color: getHeatColor(countryDataMap[hoveredCountry].stress_score),
                }}>
                  {countryDataMap[hoveredCountry].stress_score >= 70 ? 'Critical' :
                   countryDataMap[hoveredCountry].stress_score >= 50 ? 'High' :
                   countryDataMap[hoveredCountry].stress_score >= 30 ? 'Moderate' : 'Low'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-4 left-4 p-2 rounded-xl shadow-lg" style={{
          background: legendBg, backdropFilter: 'blur(12px)',
          border: `1px solid ${legendBorder}`,
        }}>
          <div className="flex items-center gap-2 md:gap-3">
            {[
              { label: 'Low', color: '#10b981' },
              { label: 'Moderate', color: '#eab308' },
              { label: 'High', color: '#f59e0b' },
              { label: 'Critical', color: '#ef4444' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div className="w-2 h-2.5 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}60` }} />
                <span className="text-[8px] md:text-[10px]" style={{ color: colors.axis.tick }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-4 right-4 p-2 rounded-xl text-[10px] shadow-lg" style={{
          background: legendBg, backdropFilter: 'blur(12px)',
          border: `1px solid ${legendBorder}`, color: colors.axis.tick,
        }}>
          {data.length} countries monitored
        </div>
      </div>
    </div>
  );
}
