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
import {
  DashboardCard,
  SectionContainer,
  CountryCard,
} from '@/components/design-system';

const ALL_COUNTRIES = CountryService.getAllCountries();
const MOCK_DATA = CountryService.getDashboardStressScores();

function getFlagImage(countryName: string): string {
  const country = ALL_COUNTRIES.find(c => c.name === countryName);
  return country ? CountryService.getFlagPath(country.code) : '';
}

function getStressColor(score: number): string {
  if (score >= 70) return 'text-critical';
  if (score >= 50) return 'text-elevated';
  if (score >= 30) return 'text-elevated';
  return 'text-normal';
}

function getStressGlow(score: number): string {
  if (score >= 70) return '0 0 30px var(--color-critical-30)';
  if (score >= 50) return '0 0 25px var(--color-elevated-30)';
  if (score >= 30) return '0 0 20px var(--color-elevated-15)';
  return '0 0 15px var(--color-normal-15)';
}

function getStatusBadge(score: number): string {
  if (score >= 70) return 'badge-critical';
  if (score >= 50) return 'badge-elevated';
  if (score >= 30) return 'badge-elevated';
  return 'badge-normal';
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
        <div className="absolute inset-0" style={{ background: 'var(--color-overlay)' }} />
      </div>

      <DashboardCard className="mb-4 md:mb-6 w-full max-w-full">
        <h1 className="text-2xl md:text-5xl font-bold break-words min-w-0">
          <span className="page-title">
            Tourism Energy Intelligence
          </span>
        </h1>
        <p className="text-muted text-sm md:text-base mt-1 md:mt-2 min-w-0">
          Real-time stress monitoring for {data.length} European countries
        </p>

        <div className="mt-4 md:mt-6 min-w-0">
          <KpiCards />
        </div>
      </DashboardCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <DashboardCard className="lg:col-span-2 h-[300px] md:h-[500px]" noPadding>
          <div className="p-3 md:p-4 h-full">
            <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Interactive Map</h2>
            <EuropeMap data={data} />
          </div>
        </DashboardCard>

        <DashboardCard title="Top 10">
          <div className="space-y-1 md:space-y-2 max-h-[300px] md:max-h-[420px] overflow-y-auto">
            {[...data]
              .sort((a, b) => b.stress_score - a.stress_score)
              .slice(0, 10)
              .map((item, index) => (
                <div
                  key={item.country}
                  className="flex items-center justify-between p-2 rounded-xl hover:scale-[1.02] transition-all text-sm md:text-base"
                  style={{ background: 'var(--color-card-hover)', border: '1px solid var(--color-border)' }}
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
        </DashboardCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <DashboardCard title="Alert Center" subtitle="Countries requiring attention">
            <AlertFeed data={data.map(d => ({ country: d.country, stress_score: d.stress_score }))} />
          </DashboardCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <DashboardCard title="System Health" subtitle="Infrastructure and model status">
            <SystemHealth />
          </DashboardCard>
        </motion.div>
      </div>

      <SectionContainer
        title="AI Executive Command Center"
        subtitle="Real-time operational intelligence and decision support"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        }
        className="mt-8 md:mt-10 mb-6"
      >
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
      </SectionContainer>

      <SectionContainer
        title="EU All European Countries"
        className="mt-4 md:mt-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {ALL_COUNTRIES.map((item) => {
            const stressData = data.find(d => d.country === item.name);
            const score = stressData?.stress_score || 0;

            return (
              <CountryCard
                key={item.code}
                country={item.name}
                code={item.code}
                flagSrc={getFlagImage(item.name)}
                stressScore={score}
              />
            );
          })}
        </div>
      </SectionContainer>
    </div>
  );
}
