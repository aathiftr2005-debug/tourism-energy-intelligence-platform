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
  axis: { label: '#374151', tick: '#6b7280', line: '#e5e7eb' },
  grid: '#f1f5f9',
  tooltip: { background: '#ffffff', text: '#111827', border: '#e5e7eb' },
  legend: '#374151',
  title: '#111827',
  subtitle: '#6b7280',
  line: { historical: '#2563eb', prediction: '#ea580c', ensemble: '#7c3aed', confidence: '#059669' },
  bar: { critical: '#dc2626', elevated: '#d97706', moderate: '#ca8a04', normal: '#059669' },
  area: { fill: 'rgba(37,99,235,0.06)' },
  track: '#f1f5f9',
  badgeText: '#6b7280',
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
