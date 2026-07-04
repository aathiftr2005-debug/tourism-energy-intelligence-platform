'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { COUNTRY_FLAGS, COUNTRY_NAMES } from '@/lib/types';
import ReportContent from '@/components/reports/ReportContent';
import { exportCSV, exportExcel, exportPDF, type ReportData } from '@/components/reports/exportUtils';
import { CountryService, EnergyService } from '@/lib/services';

const countries = Object.entries(COUNTRY_NAMES);

const countryStressScores: Record<string, { score: number; level: string }> =
  Object.fromEntries(
    CountryService.getStressPageCountries().map((c) => {
      const ss = EnergyService.getStressScore(c.code);
      return [c.code, { score: ss?.score ?? 0, level: ss?.level ?? 'NORMAL' }];
    })
  );

function getTrend(country: string): 'up' | 'down' | 'stable' {
  const rising = ['ES', 'GR', 'IT', 'FR'];
  const falling = ['NL', 'AT', 'CZ'];
  if (rising.includes(country)) return 'up';
  if (falling.includes(country)) return 'down';
  return 'stable';
}

function getConfidence(score: number): number {
  if (score >= 70) return 96.8;
  if (score >= 50) return 94.2;
  return 91.5;
}

function getRiskFactors(score: number, level: string): Record<string, number> {
  const base = level === 'CRITICAL' ? 0.75 : level === 'ELEVATED' ? 0.55 : 0.25;
  return {
    tourism: base + 0.07,
    weather: base + 0.03,
    flights: base - 0.02,
    energy_demand: score / 100,
  };
}

function generateInsight(country: string, score: number): string {
  if (score >= 70) {
    return `${country} is experiencing critical energy stress driven by elevated tourism demand, high temperatures, and increased flight traffic. Immediate intervention is required to prevent grid instability.`;
  }
  if (score >= 50) {
    return `${country}'s projected energy stress is rising due to growing tourism inflows and seasonal temperature variations. Current conditions are elevated but remain manageable with proactive monitoring.`;
  }
  return `${country}'s energy conditions remain stable with low stress across all monitored factors. Standard operations are sufficient.`;
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

function buildReportData(country: string, reportType: 'executive' | 'government'): ReportData {
  const stress = countryStressScores[country] || { score: 0, level: 'NORMAL' };
  const now = new Date();
  return {
    country_code: country,
    country_name: COUNTRY_NAMES[country] || country,
    flag: COUNTRY_FLAGS[country] || '',
    stress_score: stress.score,
    stress_level: stress.level,
    forecast: stress.score + 3.5,
    trend: getTrend(country),
    confidence: getConfidence(stress.score),
    risk_factors: getRiskFactors(stress.score, stress.level),
    insight: generateInsight(COUNTRY_NAMES[country] || country, stress.score),
    recommendation: generateRecommendation(stress.score),
    date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  };
}

export default function ReportsPage() {
  const [country, setCountry] = useState('DE');
  const [reportType, setReportType] = useState<'executive' | 'government'>('executive');
  const reportRef = useRef<HTMLDivElement>(null);

  const data = buildReportData(country, reportType);

  const handleDownloadPDF = () => {
    exportPDF('report-content');
  };

  const handleDownloadCSV = () => {
    exportCSV(data);
  };

  const handleDownloadExcel = () => {
    exportExcel(data);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Generate professional PDF, CSV, and Excel reports for any country</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="glass-select w-full sm:min-w-[200px]"
        >
          {countries.map(([k, v]) => (
            <option key={k} value={k}>{COUNTRY_FLAGS[k]} {v}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          {(['executive', 'government'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className="px-4 py-2 rounded-full text-xs font-medium transition-all"
              style={{
                background: reportType === type ? 'linear-gradient(135deg, #00d4ff22, #7c3aed22)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${reportType === type ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: reportType === type ? '#00d4ff' : 'rgba(255,255,255,0.4)',
                textTransform: 'capitalize',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={handleDownloadPDF} className="btn-primary text-xs flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
            </svg>
            Download PDF
          </button>
          <button onClick={handleDownloadCSV} className="btn-secondary text-xs flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download CSV
          </button>
          <button onClick={handleDownloadExcel} className="btn-secondary text-xs flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Excel
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div id="report-content" ref={reportRef} style={{ overflow: 'auto', maxHeight: '70vh' }}>
          <ReportContent
            country_code={data.country_code}
            country_name={data.country_name}
            flag={data.flag}
            stress_score={data.stress_score}
            stress_level={data.stress_level}
            forecast={data.forecast}
            trend={data.trend}
            confidence={data.confidence}
            risk_factors={data.risk_factors}
            insight={data.insight}
            recommendation={data.recommendation}
            reportType={reportType}
            date={data.date}
          />
        </div>
      </div>
    </motion.div>
  );
}
