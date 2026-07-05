'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ForecastService } from '@/lib/services';
import { useTheme } from '@/lib/theme/ThemeContext';
import { getChartColors, type ChartColors } from '@/lib/theme/chartColors';

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

export default function HistoricalTrendsChart({ country }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getChartColors(isDark);
  const [animatedData, setAnimatedData] = useState<TrendPoint[]>([]);
  const data = ForecastService.getHistoricalTrends(country) as TrendPoint[];

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedData(data), 200);
    return () => clearTimeout(timer);
  }, [country, data]);

  const renderTooltip = useCallback(({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="rounded-2xl p-3 shadow-2xl" style={{ background: colors.tooltip.background, border: `1px solid ${colors.tooltip.border}` }}>
        <p className="text-xs mb-2 font-semibold" style={{ color: colors.tooltip.text }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: p.color }}>
            {p.name}: {p.value?.toFixed?.(1) ?? p.value}
          </p>
        ))}
      </div>
    );
  }, [colors]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={animatedData.length ? animatedData : data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.axis.tick }} axisLine={{ stroke: colors.axis.line }} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: colors.axis.tick }} axisLine={{ stroke: colors.axis.line }} tickLine={false} />
          <Tooltip content={renderTooltip} />
          <Legend wrapperStyle={{ fontSize: '11px', color: colors.legend }} />
          <Line type="monotone" dataKey="stress" stroke={colors.line.historical} strokeWidth={2.5} dot={{ r: 4, fill: colors.line.historical, strokeWidth: 2, stroke: isDark ? '#0a0e1a' : '#ffffff' }} name="Historical Stress" />
          <Line type="monotone" dataKey="forecast" stroke={colors.line.prediction} strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 4, fill: colors.line.prediction, strokeWidth: 2, stroke: isDark ? '#0a0e1a' : '#ffffff' }} name="Forecast" />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
