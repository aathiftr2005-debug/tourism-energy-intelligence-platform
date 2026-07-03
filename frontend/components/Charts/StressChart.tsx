'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface Props {
  data: { country_code?: string; country?: string; stress_score: number }[];
}

function getColor(score: number): string {
  if (score >= 70) return '#ef4444';
  if (score >= 50) return '#f59e0b';
  if (score >= 30) return '#eab308';
  return '#10b981';
}

export default function StressChart({ data }: Props) {
  const chartData = [...data]
    .sort((a, b) => (b.stress_score ?? 0) - (a.stress_score ?? 0))
    .slice(0, 10)
    .map((d) => ({
      name: d.country_code || d.country || '??',
      score: d.stress_score ?? 0,
    }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} />
        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: '#111827',
            border: '1px solid rgba(0,212,255,0.15)',
            borderRadius: 12,
            color: '#f0f0ff',
          }}
        />
        <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={36}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={getColor(entry.score)} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
