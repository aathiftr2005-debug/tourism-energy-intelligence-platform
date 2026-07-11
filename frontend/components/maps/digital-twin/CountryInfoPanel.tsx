'use client';

import { motion } from 'framer-motion';
import type { CountryDigitalTwinData } from './types';
import { FLAGS, getLayerColor } from './data';

interface Props {
  data: CountryDigitalTwinData;
  onClose: () => void;
}

function TrendArrow({ direction }: { direction: 'up' | 'down' | 'stable' }) {
  const color = direction === 'up' ? '#ef4444' : direction === 'down' ? '#10b981' : '#f59e0b';
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {direction === 'up' && <polyline points="18 15 12 9 6 15" />}
      {direction === 'down' && <polyline points="6 9 12 15 18 9" />}
      {direction === 'stable' && <line x1="5" y1="12" x2="19" y2="12" />}
    </svg>
  );
}

export default function CountryInfoPanel({ data, onClose }: Props) {
  const riskColor = data.riskLevel === 'critical' ? '#ef4444' : data.riskLevel === 'high' ? '#f59e0b' : data.riskLevel === 'medium' ? '#00d4ff' : '#10b981';

  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full lg:w-[360px] flex-shrink-0 overflow-hidden"
    >
      <div
        className="rounded-2xl p-5 h-full overflow-y-auto"
        style={{
          background: 'var(--color-card)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--light-card-shadow-md)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{FLAGS[data.country_code] || ''}</span>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--color-text-heading)' }}>{data.country}</h2>
              <span className="text-[10px] font-medium tracking-wider" style={{ color: 'var(--color-text-caption)' }}>{data.country_code}</span>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'var(--color-card-hover)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-critical-15)'; e.currentTarget.style.borderColor = 'var(--color-critical-30)'; e.currentTarget.style.color = 'var(--color-critical)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-card-hover)'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
            aria-label="Close panel"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="flex items-center justify-center py-4 mb-4 rounded-xl" style={{ background: 'var(--color-card-hover)', border: '1px solid var(--color-border)' }}>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-caption)' }}>Risk Level</p>
            <motion.p
              key={data.country_code}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-extrabold uppercase"
              style={{ color: riskColor, textShadow: `0 0 25px ${riskColor}30` }}
            >
              {data.riskLevel}
            </motion.p>
            <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-caption)' }}>
              Overall Risk Assessment
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Energy Usage', value: `${data.energyUsage} GWh`, color: '#00d4ff' },
            { label: 'Renewable %', value: `${data.renewablePercent}%`, color: '#10b981' },
            { label: 'Tourist Count', value: `${(data.touristCount / 1000000).toFixed(1)}M`, color: '#7c3aed' },
            { label: 'Carbon Emissions', value: `${data.carbonEmissions}Kt`, color: '#f59e0b' },
            { label: 'Weather', value: `${data.weather.temperature}\u00b0C ${data.weather.condition}`, color: '#f0f0ff' },
            { label: 'Grid Health', value: `${data.gridHealth}%`, color: getLayerColor(data.gridHealth, 'grid') },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: 'var(--color-card-hover)', border: '1px solid var(--color-border)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-caption)' }}>{item.label}</p>
              <p className="text-sm font-bold" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-caption)' }}>24h Forecast</p>
          <div className="grid grid-cols-2 gap-2">
            {data.forecast24h.map((f) => (
              <div key={f.label} className="rounded-xl p-3 flex items-center justify-between" style={{ background: 'var(--color-card-hover)', border: '1px solid var(--color-border)' }}>
                <div>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-text-caption)' }}>{f.label}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--color-text-heading)' }}>{f.value}</p>
                </div>
                <TrendArrow direction={f.direction} />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 rounded-xl p-3" style={{ background: 'var(--color-accent-5)', border: '1px solid var(--color-accent-8)' }}>
          <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-accent)' }}>AI Summary</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-body)' }}>
            {data.aiSummary}
          </p>
        </div>

        <div className="rounded-xl p-3" style={{ background: `${riskColor}10`, border: `1px solid ${riskColor}20` }}>
          <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: `${riskColor}70` }}>AI Recommendation</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-body)' }}>
            {data.aiRecommendation}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
