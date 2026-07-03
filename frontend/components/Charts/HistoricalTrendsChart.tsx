'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
interface Props {
  country: string;
}

interface TrendPoint {
  label: string;
  year: number;
  stress: number;
  forecast?: number;
  lower?: number;
  upper?: number;
}

import { ForecastService } from '@/lib/services';

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

export default function HistoricalTrendsChart({ country }: Props) {
  const [animatedData, setAnimatedData] = useState<TrendPoint[]>([]);
  const data = ForecastService.getHistoricalTrends(country) as TrendPoint[];

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedData(data), 200);
    return () => clearTimeout(timer);
  }, [country, data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={animatedData.length ? animatedData : data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} unit="" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Line type="monotone" dataKey="stress" stroke="#00d4ff" strokeWidth={2.5} dot={{ r: 4, fill: '#00d4ff', strokeWidth: 2, stroke: '#0a0e1a' }} name="Historical Stress" />
          <Line type="monotone" dataKey="forecast" stroke="#7c3aed" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#0a0e1a' }} name="Forecast" />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
