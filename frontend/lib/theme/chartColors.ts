export interface ChartColors {
  axis: { label: string; tick: string; line: string };
  grid: string;
  tooltip: { background: string; text: string; border: string };
  legend: string;
  title: string;
  subtitle: string;
  line: { historical: string; prediction: string; ensemble: string; confidence: string };
  bar: { critical: string; elevated: string; moderate: string; normal: string };
  area: { fill: string };
  track: string;
  badgeText: string;
}

const light: ChartColors = {
  axis: { label: '#374151', tick: '#6B7280', line: '#D1D5DB' },
  grid: '#E5E7EB',
  tooltip: { background: '#FFFFFF', text: '#111827', border: '#E5E7EB' },
  legend: '#374151',
  title: '#111827',
  subtitle: '#6B7280',
  line: { historical: '#2563EB', prediction: '#EA580C', ensemble: '#7C3AED', confidence: '#059669' },
  bar: { critical: '#DC2626', elevated: '#D97706', moderate: '#CA8A04', normal: '#059669' },
  area: { fill: 'rgba(37,99,235,0.08)' },
  track: '#E5E7EB',
  badgeText: '#6B7280',
};

const dark: ChartColors = {
  axis: { label: '#9CA3AF', tick: '#6B7280', line: '#374151' },
  grid: 'rgba(255,255,255,0.04)',
  tooltip: { background: '#111827', text: '#f0f0ff', border: 'rgba(0,212,255,0.15)' },
  legend: '#9CA3AF',
  title: '#f0f0ff',
  subtitle: 'rgba(255,255,255,0.35)',
  line: { historical: '#00d4ff', prediction: '#f59e0b', ensemble: '#7c3aed', confidence: '#10b981' },
  bar: { critical: '#ef4444', elevated: '#f59e0b', moderate: '#eab308', normal: '#10b981' },
  area: { fill: 'rgba(0,212,255,0.04)' },
  track: 'rgba(255,255,255,0.04)',
  badgeText: 'rgba(255,255,255,0.35)',
};

export function getChartColors(isDark: boolean): ChartColors {
  return isDark ? dark : light;
}

export function getStressColor(score: number, isDark: boolean): string {
  const c = getChartColors(isDark);
  if (score >= 70) return c.bar.critical;
  if (score >= 50) return c.bar.elevated;
  if (score >= 30) return c.bar.moderate;
  return c.bar.normal;
}
