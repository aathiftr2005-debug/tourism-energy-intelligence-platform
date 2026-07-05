'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import EuropeMap from '@/components/maps/EuropeMap';
import AlertFeed from '@/components/alerts/AlertFeed';
import KpiCards from '@/components/UI/KpiCards';
import SystemHealth from '@/components/UI/SystemHealth';
import {
  ExecutiveSummary,
  CriticalAlerts,
  AIRecommendations,
  RiskPrediction,
  ForecastPanel,
  GovernmentReadiness,
} from '@/components/executive';
import { CountryService } from '@/lib/services';

const ALL_COUNTRIES = CountryService.getAllCountries();
const MOCK_DATA = CountryService.getDashboardStressScores();

function getFlagImage(countryName: string): string {
  const country = ALL_COUNTRIES.find(c => c.name === countryName);
  return country ? CountryService.getFlagPath(country.code) : '';
}

function getStressColor(score: number): string {
  if (score >= 70) return 'text-red-400';
  if (score >= 50) return 'text-orange-400';
  if (score >= 30) return 'text-yellow-400';
  return 'text-green-400';
}

function getStressGlow(score: number): string {
  if (score >= 70) return '0 0 30px rgba(239,68,68,0.3)';
  if (score >= 50) return '0 0 25px rgba(251,146,60,0.2)';
  if (score >= 30) return '0 0 20px rgba(234,179,8,0.15)';
  return '0 0 15px rgba(34,197,94,0.15)';
}

function getStatusBadge(score: number): string {
  if (score >= 70) return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (score >= 50) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  if (score >= 30) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-green-500/20 text-green-400 border-green-500/30';
}

function getStatusText(score: number): string {
  if (score >= 70) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 30) return 'Moderate';
  return 'Low';
}

export default function Dashboard() {
  const [data, setData] = useState(MOCK_DATA);

  return (
    <div className="min-h-screen p-3 md:p-6 relative overflow-x-hidden">

      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <Image
          src="/images/map-bg.jpg"
          alt=""
          aria-hidden="true"
          fill
          className="object-cover opacity-[0.05]"
        />
        <div className="absolute inset-0 bg-[#0a0e1a]/70" />
      </div>

      <div className="glass-card p-4 md:p-8 mb-4 md:mb-6 w-full max-w-full">
        <h1 className="text-2xl md:text-5xl font-bold break-words min-w-0">
          <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Tourism Energy Intelligence
          </span>
        </h1>
        <p className="text-muted text-sm md:text-base mt-1 md:mt-2 min-w-0">
          Real-time stress monitoring for {data.length} European countries
        </p>

        <div className="mt-4 md:mt-6 min-w-0">
          <KpiCards />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 glass-card p-3 md:p-4 h-[300px] md:h-[500px]">
          <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Interactive Map</h2>
          <EuropeMap data={data} />
        </div>

        <div className="glass-card p-3 md:p-4">
          <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Top 10</h2>
          <div className="space-y-1 md:space-y-2 max-h-[300px] md:max-h-[420px] overflow-y-auto">
            {[...data]
              .sort((a, b) => b.stress_score - a.stress_score)
              .slice(0, 10)
              .map((item, index) => (
                <div
                  key={item.country}
                  className="flex items-center justify-between p-2 glass-card hover:scale-[1.02] transition-all text-sm md:text-base"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-caption text-xs md:text-sm w-5 flex-shrink-0">#{index + 1}</span>
                    <Image
                      src={getFlagImage(item.country)}
                      alt={item.country}
                      width={640}
                      height={427}
                      className="w-5 h-auto object-contain rounded flex-shrink-0"
                    />
                    <span className="font-medium truncate text-xs md:text-sm">{item.country}</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                    <span className={`text-base md:text-lg font-bold ${getStressColor(item.stress_score)}`}>
                      {Math.round(item.stress_score)}
                    </span>
                    <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full border ${getStatusBadge(item.stress_score)}`}>
                      {getStatusText(item.stress_score)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-card p-4"
        >
          <h2 className="text-heading text-lg md:text-xl font-bold mb-3">Alert Center</h2>
          <p className="text-caption text-xs mb-3">Countries requiring attention</p>
          <AlertFeed data={data.map(d => ({ country: d.country, stress_score: d.stress_score }))} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="glass-card p-4"
        >
          <h2 className="text-heading text-lg md:text-xl font-bold mb-3">System Health</h2>
          <p className="text-caption text-xs mb-3">Infrastructure and model status</p>
          <SystemHealth />
        </motion.div>
      </div>

      <div className="mt-8 md:mt-10 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(124,58,237,0.12))', border: '1px solid rgba(0,212,255,0.2)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <h2 className="text-heading text-xl font-bold">AI Executive Command Center</h2>
            <p className="text-caption text-xs">
              Real-time operational intelligence and decision support
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <ExecutiveSummary />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <CriticalAlerts />
            </div>
            <div>
              <GovernmentReadiness />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <AIRecommendations />
            <RiskPrediction />
          </div>

          <ForecastPanel />
        </div>
      </div>

      <div className="mt-4 md:mt-6">
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">EU All European Countries</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {ALL_COUNTRIES.map((item) => {
            const stressData = data.find(d => d.country === item.name);
            const score = stressData?.stress_score || 0;

            return (
              <div
                key={item.code}
                className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-white/25 transition-all duration-500 hover:scale-[1.04] hover:shadow-[0_0_40px_rgba(0,212,255,0.15)] cursor-pointer"
              >
                  <div className="absolute inset-0 w-full h-full">
                    <Image
                      src={getFlagImage(item.name)}
                      alt=""
                      fill
                      className="object-cover scale-110 group-hover:scale-125 transition-transform duration-700 opacity-25 group-hover:opacity-35 blur-sm"
                    />
                  </div>

                <div className="absolute inset-0 bg-gradient-to-b from-[rgba(10,14,26,0.4)] via-[rgba(10,14,26,0.6)] to-[rgba(10,14,26,0.85)]" />

                <div className="relative z-10 p-3 md:p-4 flex flex-col items-center text-center min-h-[140px] md:min-h-[160px]">
                  <div className="w-10 h-7 md:w-12 md:h-8 rounded-lg overflow-hidden border border-white/15 bg-white/5 backdrop-blur-sm mb-2 flex items-center justify-center shadow-lg relative">
                    <Image
                      src={getFlagImage(item.name)}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <h3 className="font-semibold text-heading text-xs md:text-sm truncate w-full">
                    {item.name}
                  </h3>

                  <div className="mt-auto">
                    {stressData ? (
                      <>
                        <div
                          className={`text-2xl md:text-3xl font-extrabold tracking-tight ${getStressColor(score)}`}
                          style={{ textShadow: getStressGlow(score) }}
                        >
                          {Math.round(score)}
                        </div>
                        <span className={`inline-block mt-1 text-[10px] md:text-xs px-2.5 py-0.5 rounded-full border ${getStatusBadge(score)} backdrop-blur-sm`}>
                          {getStatusText(score)}
                        </span>
                      </>
                    ) : (
                      <div className="text-caption text-xs py-3">No data</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
