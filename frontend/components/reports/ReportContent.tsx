'use client';

import { forwardRef } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface ReportContentProps {
  country_code: string;
  country_name: string;
  flag: string;
  stress_score: number;
  stress_level: string;
  forecast: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  risk_factors: Record<string, number>;
  insight: string;
  recommendation: string;
  reportType: 'executive' | 'government';
  date: string;
}

const riskFactorLabels: Record<string, string> = {
  tourism: 'Tourism',
  weather: 'Weather',
  flights: 'Flights',
  energy_demand: 'Energy Demand',
};

function getScoreColor(score: number): string {
  if (score >= 70) return '#ef4444';
  if (score >= 50) return '#f59e0b';
  if (score >= 30) return '#eab308';
  return '#10b981';
}

import { CountryService } from '@/lib/services';

const barData = CountryService.getMapStressScores().map(s => ({ name: s.country_code, score: s.stress_score }));

const ReportContent = forwardRef<HTMLDivElement, ReportContentProps>(function ReportContent(props, ref) {
  const {
    country_code, country_name, flag, stress_score, stress_level,
    forecast, trend, confidence, risk_factors, insight, recommendation,
    reportType, date,
  } = props;

  const scoreColor = getScoreColor(stress_score);

  return (
    <div ref={ref} className="report-content" style={{ background: '#ffffff', color: '#111827', padding: 40, fontFamily: "'Inter', Arial, sans-serif" }}>
      <div style={{ borderBottom: '3px solid #00d4ff', paddingBottom: 24, marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Tourism Energy Intelligence
          </h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
            {reportType === 'executive' ? 'Executive Report' : 'Government Report'} &mdash; {date}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 36 }}>{flag}</span>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 0', color: '#111827' }}>{country_name}</h2>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{country_code}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Stress Score', value: stress_score.toFixed(1), color: scoreColor },
          { label: 'Forecast', value: forecast.toFixed(1), color: '#111827' },
          { label: 'Trend', value: trend === 'up' ? 'Rising' : trend === 'down' ? 'Falling' : 'Stable', color: trend === 'up' ? '#ef4444' : trend === 'down' ? '#10b981' : '#f59e0b' },
          { label: 'Confidence', value: `${confidence.toFixed(0)}%`, color: confidence >= 90 ? '#10b981' : '#f59e0b' },
        ].map((item) => (
          <div key={item.label} style={{
            background: '#f9fafb', borderRadius: 12, padding: 16, textAlign: 'center',
            border: '1px solid #e5e7eb',
          }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', margin: '0 0 6px' }}>{item.label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#374151', borderBottom: '2px solid #00d4ff', paddingBottom: 8 }}>Risk Factor Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {Object.entries(risk_factors).map(([key, value]) => {
            const pct = Math.round((value || 0) * 100);
            const color = pct >= 70 ? '#ef4444' : pct >= 50 ? '#f59e0b' : pct >= 30 ? '#eab308' : '#10b981';
            return (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{riskFactorLabels[key] || key}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color }}>{pct}%</span>
                </div>
                <div style={{ width: '100%', height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${color}60, ${color})`, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#374151', borderBottom: '2px solid #00d4ff', paddingBottom: 8 }}>Stress Score Comparison</h3>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {barData.map((entry) => (
                  <Cell key={entry.name} fill={entry.name === country_code ? '#00d4ff' : getScoreColor(entry.score)} fillOpacity={entry.name === country_code ? 1 : 0.5} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {reportType === 'government' && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: '#374151', borderBottom: '2px solid #00d4ff', paddingBottom: 8 }}>Forecast Trajectory</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { year: '2022', stress: stress_score - 12 }, { year: '2023', stress: stress_score - 8 },
                { year: '2024', stress: stress_score - 3 }, { year: '2025', stress: stress_score },
                { year: '2026', stress: forecast },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip />
                <Line type="monotone" dataKey="stress" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: '#7c3aed' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24, background: '#f0f9ff', borderRadius: 12, padding: 20, border: '1px solid #bae6fd' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: '#0369a1' }}>AI Insight</h3>
        <p style={{ fontSize: 12, lineHeight: 1.6, color: '#1e293b', margin: 0 }}>{insight}</p>
      </div>

      <div style={{ marginBottom: 24, background: stress_score >= 70 ? '#fef2f2' : '#f0fdf4', borderRadius: 12, padding: 20, border: `1px solid ${stress_score >= 70 ? '#fecaca' : '#bbf7d0'}` }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: stress_score >= 70 ? '#dc2626' : '#16a34a' }}>AI Recommendation</h3>
        <p style={{ fontSize: 12, lineHeight: 1.6, color: '#1e293b', margin: 0 }}>{recommendation}</p>
      </div>

      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>
          Tourism Energy Intelligence Platform &mdash; AI-Powered Seasonal Energy Demand Forecasting
        </p>
        <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>
          Generated: {date}
        </p>
      </div>
    </div>
  );
});

export default ReportContent;
