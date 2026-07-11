'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { COUNTRY_FLAGS, COUNTRY_NAMES } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CountryService, ForecastService } from '@/lib/services';
import { useTheme } from '@/lib/theme/ThemeContext';
import { getChartColors } from '@/lib/theme/chartColors';
import { DashboardCard, PremiumButton } from '@/components/design-system';

const COUNTRIES = Object.entries(COUNTRY_NAMES);
const sampleMonths = ForecastService.getMonthlyEnergy().map((m: { month: string }) => m.month);
const sampleBaseline = ForecastService.getSimulatorBaseline();
const sampleSimulated = ForecastService.getSimulatorSimulated();

export default function SimulatorPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getChartColors(isDark);
  const [country, setCountry] = useState('ES');
  const [touristChange, setTouristChange] = useState(0);
  const [tempDeviation, setTempDeviation] = useState(0);
  const [flightMultiplier, setFlightMultiplier] = useState(1);
  const [eventBoost, setEventBoost] = useState(0);
  const [simulated, setSimulated] = useState(false);

  const chartData = sampleMonths.map((m, i) => ({
    month: m,
    baseline: sampleBaseline[i],
    simulated: simulated ? sampleSimulated[i] : undefined,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Scenario Simulator</h1>
        <p className="page-subtitle">Model how parameter changes affect energy stress</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Adjust Scenario Parameters" className="space-y-5">

          <select value={country} onChange={(e) => setCountry(e.target.value)} className="glass-select w-full">
            {COUNTRIES.map(([k, v]) => (
              <option key={k} value={k}>{COUNTRY_FLAGS[k]} {v}</option>
            ))}
          </select>

          {[
            { label: 'Tourist Arrivals Change', val: touristChange, set: setTouristChange, min: -50, max: 100, unit: '%' },
            { label: 'Temperature Deviation', val: tempDeviation, set: setTempDeviation, min: -10, max: 10, unit: '\u00b0C' },
            { label: 'Flight Arrivals Multiplier', val: flightMultiplier, set: setFlightMultiplier, min: 0.5, max: 3, step: 0.1, unit: 'x' },
            { label: 'Special Event Boost', val: eventBoost, set: setEventBoost, min: 0, max: 50, unit: '%' },
          ].map((s) => (
            <div key={s.label}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted">{s.label}</label>
                <span className="text-xs font-mono text-accent">{s.val}{s.unit}</span>
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step ?? 1} value={s.val}
                onChange={(e) => s.set(Number(e.target.value))}
                className="w-full" />
            </div>
          ))}

          <PremiumButton variant="primary" onClick={() => setSimulated(true)} className="w-full text-sm">
            Run Simulation
          </PremiumButton>
          <PremiumButton variant="ghost" onClick={() => { setSimulated(false); setTouristChange(0); setTempDeviation(0); setFlightMultiplier(1); setEventBoost(0); }} className="w-full text-center text-xs">
            Reset to Baseline
          </PremiumButton>
        </DashboardCard>

        <DashboardCard title="Simulation Results" className="space-y-5">

          {simulated ? (
            <>
              <div className="flex items-center justify-center gap-4 md:gap-8 py-4">
                <div className="text-center">
                  <p className="text-xs mb-1 text-muted">Baseline</p>
                  <p className="text-3xl font-bold text-muted">65.2</p>
                </div>
                <div className="text-2xl text-muted">&rarr;</div>
                <div className="text-center">
                  <p className="text-xs mb-1 text-muted">Simulated</p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--color-critical)', textShadow: '0 0 20px var(--color-critical-30)' }}>81.7</p>
                  <span className="badge-critical text-xs">CRITICAL</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                  <XAxis dataKey="month" stroke={colors.axis.tick} fontSize={11} />
                  <YAxis stroke={colors.axis.tick} fontSize={11} />
                  <Tooltip contentStyle={{ background: colors.tooltip.background, border: `1px solid ${colors.tooltip.border}`, borderRadius: 12, color: colors.tooltip.text }} />
                  <Bar dataKey="baseline" fill="var(--color-text-disabled)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="simulated" fill="var(--color-critical)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="rounded-xl p-4 text-xs leading-relaxed" style={{ background: 'var(--color-accent-5)', border: '1px solid var(--color-accent-8)' }}>
                <p className="font-semibold mb-1 text-accent">What Changed</p>
                <ul className="list-disc list-inside space-y-1 text-body">
                  <li>Tourist arrivals +{touristChange}% increases accommodation energy demand</li>
                  <li>Temperature +{tempDeviation}&deg;C drives cooling load</li>
                  <li>Flight traffic x{flightMultiplier} affects airport energy consumption</li>
                  {eventBoost > 0 && <li>Special event boost +{eventBoost}% adds localized pressure</li>}
                </ul>
              </div>
            </>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-muted">
              Adjust parameters and run a simulation
            </div>
          )}
        </DashboardCard>
      </div>
    </motion.div>
  );
}
