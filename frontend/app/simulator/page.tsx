'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { COUNTRY_FLAGS, COUNTRY_NAMES } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CountryService, ForecastService } from '@/lib/services';

const COUNTRIES = Object.entries(COUNTRY_NAMES);
const sampleMonths = ForecastService.getMonthlyEnergy().map((m: { month: string }) => m.month);
const sampleBaseline = ForecastService.getSimulatorBaseline();
const sampleSimulated = ForecastService.getSimulatorSimulated();

export default function SimulatorPage() {
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
        <div className="glass-card space-y-5">
          <h2 className="section-title">Adjust Scenario Parameters</h2>

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
                <label className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</label>
                <span className="text-xs font-mono" style={{ color: '#00d4ff' }}>{s.val}{s.unit}</span>
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step ?? 1} value={s.val}
                onChange={(e) => s.set(Number(e.target.value))}
                className="w-full" />
            </div>
          ))}

          <button onClick={() => setSimulated(true)} className="btn-primary w-full text-sm">
            Run Simulation
          </button>
          <button onClick={() => { setSimulated(false); setTouristChange(0); setTempDeviation(0); setFlightMultiplier(1); setEventBoost(0); }}
            className="btn-ghost w-full text-center text-xs">
            Reset to Baseline
          </button>
        </div>

        <div className="glass-card space-y-5">
          <h2 className="section-title">Simulation Results</h2>

          {simulated ? (
            <>
              <div className="flex items-center justify-center gap-4 md:gap-8 py-4">
                <div className="text-center">
                  <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Baseline</p>
                  <p className="text-3xl font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>65.2</p>
                </div>
                <div className="text-2xl" style={{ color: 'rgba(255,255,255,0.3)' }}>&rarr;</div>
                <div className="text-center">
                  <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Simulated</p>
                  <p className="text-3xl font-bold" style={{ color: '#ef4444', textShadow: '0 0 20px rgba(239,68,68,0.3)' }}>81.7</p>
                  <span className="badge-critical text-xs">CRITICAL</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 12, color: '#f0f0ff' }} />
                  <Bar dataKey="baseline" fill="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="simulated" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="rounded-xl p-4 text-xs leading-relaxed" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)' }}>
                <p className="font-semibold mb-1" style={{ color: '#00d4ff' }}>What Changed</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Tourist arrivals +{touristChange}% increases accommodation energy demand</li>
                  <li>Temperature +{tempDeviation}&deg;C drives cooling load</li>
                  <li>Flight traffic x{flightMultiplier} affects airport energy consumption</li>
                  {eventBoost > 0 && <li>Special event boost +{eventBoost}% adds localized pressure</li>}
                </ul>
              </div>
            </>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Adjust parameters and run a simulation
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
