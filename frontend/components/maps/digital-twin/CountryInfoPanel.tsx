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
          background: 'rgba(10,14,26,0.92)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(0,212,255,0.1)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{FLAGS[data.country_code] || ''}</span>
            <div>
              <h2 className="text-base font-bold" style={{ color: '#f0f0ff' }}>{data.country}</h2>
              <span className="text-[10px] font-medium tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{data.country_code}</span>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
            aria-label="Close panel"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="flex items-center justify-center py-4 mb-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Risk Level</p>
            <motion.p
              key={data.country_code}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-extrabold uppercase"
              style={{ color: riskColor, textShadow: `0 0 25px ${riskColor}30` }}
            >
              {data.riskLevel}
            </motion.p>
            <span className="text-[10px] font-medium" style={{ color: `rgba(255,255,255,0.3)` }}>
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
            <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.label}</p>
              <p className="text-sm font-bold" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>24h Forecast</p>
          <div className="grid grid-cols-2 gap-2">
            {data.forecast24h.map((f) => (
              <div key={f.label} className="rounded-xl p-3 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{f.label}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: '#f0f0ff' }}>{f.value}</p>
                </div>
                <TrendArrow direction={f.direction} />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 rounded-xl p-3" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}>
          <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'rgba(0,212,255,0.5)' }}>AI Summary</p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {data.aiSummary}
          </p>
        </div>

        <div className="rounded-xl p-3" style={{ background: `${riskColor}10`, border: `1px solid ${riskColor}20` }}>
          <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: `${riskColor}70` }}>AI Recommendation</p>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {data.aiRecommendation}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
