'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '@/lib/theme/ThemeContext';
import { getChartColors, getStressColor } from '@/lib/theme/chartColors';

interface Props {
  data: { country_code?: string; country?: string; stress_score: number }[];
}

export default function StressChart({ data }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const colors = getChartColors(isDark);

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
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="name" stroke={colors.axis.tick} fontSize={11} tickLine={false} />
        <YAxis stroke={colors.axis.tick} fontSize={11} tickLine={false} />
        <Tooltip
          contentStyle={{
            background: colors.tooltip.background,
            border: `1px solid ${colors.tooltip.border}`,
            borderRadius: 12,
            color: colors.tooltip.text,
          }}
        />
        <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={36}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={getStressColor(entry.score, isDark)} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
