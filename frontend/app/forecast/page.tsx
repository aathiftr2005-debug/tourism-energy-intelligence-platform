'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart,
} from 'recharts';
import { COUNTRY_FLAGS, COUNTRY_NAMES } from '@/lib/types';
import HistoricalTrendsChart from '@/components/Charts/HistoricalTrendsChart';
import SeasonalCard from '@/components/cards/SeasonalCard';
import { CountryService, ForecastService } from '@/lib/services';

const countries = CountryService.getForecastCountries();
const historicalData = ForecastService.getMonthlyEnergy();
const forecastData = ForecastService.getMonthlyForecast();
const modelMetrics = ForecastService.getModelMetrics();

function r2Color(r2: number): string {
  if (r2 >= 0.85) return '#10b981';
  if (r2 >= 0.70) return '#f59e0b';
  return '#ef4444';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-2xl border border-[rgba(0,212,255,0.15)] p-3 shadow-2xl" style={{ background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(16px)' }}>
      <p className="text-xs mb-2 font-semibold" style={{ color: '#f0f0ff' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: {p.value?.toFixed?.(1) ?? p.value}
        </p>
      ))}
    </div>
  );
};

export default function ForecastPage() {
  const [country, setCountry] = useState('DE');
  const [months, setMonths] = useState(12);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Energy Forecast</h1>
        <p className="page-subtitle">AI-powered demand prediction for European tourism regions</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="glass-select min-w-[200px]"
        >
          {countries.map((c) => (
            <option key={c} value={c}>{COUNTRY_FLAGS[c]} {COUNTRY_NAMES[c]}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          {[3, 6, 12, 24, 36].map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: months === m ? 'linear-gradient(135deg, #00d4ff22, #7c3aed22)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${months === m ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: months === m ? '#00d4ff' : 'rgba(255,255,255,0.4)',
              }}
            >
              {m}m
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{months} months</span>
          <input
            type="range"
            min={3}
            max={36}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-32"
          />
        </div>

        <button className="btn-primary text-sm">Generate Forecast</button>
      </div>

      <div className="glass-card">
        <h2 className="section-title">Forecast &mdash; {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}</h2>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={[...historicalData.slice(-6), ...forecastData]}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} unit=" GWh" />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Area type="monotone" dataKey="upper" fill="rgba(0,212,255,0.04)" stroke="none" />
            <Area type="monotone" dataKey="lower" fill="rgba(0,212,255,0.04)" stroke="none" />
            <Line type="monotone" dataKey="actual" stroke="#00d4ff" strokeWidth={2} dot={false} name="Historical" />
            <Line type="monotone" dataKey="xgb" stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="XGBoost" />
            <Line type="monotone" dataKey="prophet" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Prophet" />
            <Line type="monotone" dataKey="ensemble" stroke="#f0f0ff" strokeWidth={2.5} dot={false} name="Ensemble" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card">
        <h3 className="section-title">Model Performance Metrics</h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {['Model', 'MAE', 'RMSE', 'MAPE (%)', 'R²'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modelMetrics.map((m, i) => (
                <tr key={m.model} className="transition-colors">
                  <td className="px-4 py-3 font-semibold" style={{ color: '#f0f0ff' }}>{m.model}</td>
                  <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{m.mae}</td>
                  <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{m.rmse}</td>
                  <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)' }}>{m.mape}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: r2Color(m.r2) }}>{m.r2.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card">
        <h2 className="section-title">Historical Trends &mdash; {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}</h2>
        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Stress score trajectory from 2022 through 2026 forecast</p>
        <HistoricalTrendsChart country={country} />
      </div>

      <div className="glass-card">
        <h2 className="section-title">Seasonal Analysis &mdash; {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}</h2>
        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Average energy stress by season</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {ForecastService.getSeasonalStress().map((s) => (
            <SeasonalCard key={s.season} season={s.season} stress={s.stress} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
