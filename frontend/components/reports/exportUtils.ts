export interface ReportData {
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
  date: string;
}

export function exportCSV(data: ReportData): void {
  const headers = [
    'Country Code', 'Country Name', 'Stress Score', 'Stress Level',
    'Forecast', 'Trend', 'Confidence (%)',
    'Risk - Tourism (%)', 'Risk - Weather (%)', 'Risk - Flights (%)', 'Risk - Energy Demand (%)',
    'AI Insight', 'AI Recommendation', 'Report Date',
  ];

  const row = [
    data.country_code, data.country_name, data.stress_score.toFixed(1), data.stress_level,
    data.forecast.toFixed(1), data.trend, data.confidence.toFixed(1),
    ((data.risk_factors.tourism || 0) * 100).toFixed(0),
    ((data.risk_factors.weather || 0) * 100).toFixed(0),
    ((data.risk_factors.flights || 0) * 100).toFixed(0),
    ((data.risk_factors.energy_demand || 0) * 100).toFixed(0),
    `"${data.insight}"`, `"${data.recommendation}"`, data.date,
  ];

  const csv = [headers.join(','), row.join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.country_code}_energy_report.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportExcel(data: ReportData): void {
  const style = `
    <style>
      table { border-collapse: collapse; font-family: 'Inter', Arial, sans-serif; width: 100%; }
      th { background: #0a0e1a; color: #00d4ff; padding: 10px 14px; font-size: 12px; text-align: left; border: 1px solid rgba(255,255,255,0.1); }
      td { padding: 8px 14px; font-size: 11px; border: 1px solid rgba(255,255,255,0.08); }
      .header { font-size: 18px; font-weight: 700; padding: 16px; background: linear-gradient(135deg, #00d4ff, #7c3aed); color: white; }
      .label { font-weight: 600; color: rgba(255,255,255,0.6); }
      .critical { color: #ef4444; font-weight: 700; }
      .elevated { color: #f59e0b; font-weight: 700; }
      .normal { color: #10b981; font-weight: 700; }
    </style>
  `;

  const pct = (v: number) => ((v || 0) * 100).toFixed(0);

  const html = `
    <html>
      <head><meta charset="UTF-8">${style}</head>
      <body>
        <table>
          <tr><td colspan="2" class="header">Tourism Energy Intelligence - ${data.country_name} Report</td></tr>
          <tr><td class="label">Country</td><td>${data.flag} ${data.country_name} (${data.country_code})</td></tr>
          <tr><td class="label">Stress Score</td><td class="${data.stress_level.toLowerCase()}">${data.stress_score.toFixed(1)}</td></tr>
          <tr><td class="label">Stress Level</td><td>${data.stress_level}</td></tr>
          <tr><td class="label">Forecast</td><td>${data.forecast.toFixed(1)}</td></tr>
          <tr><td class="label">Trend</td><td>${data.trend === 'up' ? '↑ Rising' : data.trend === 'down' ? '↓ Falling' : '→ Stable'}</td></tr>
          <tr><td class="label">Confidence</td><td>${data.confidence.toFixed(1)}%</td></tr>
          <tr><td class="label">Risk - Tourism</td><td>${pct(data.risk_factors.tourism)}%</td></tr>
          <tr><td class="label">Risk - Weather</td><td>${pct(data.risk_factors.weather)}%</td></tr>
          <tr><td class="label">Risk - Flights</td><td>${pct(data.risk_factors.flights)}%</td></tr>
          <tr><td class="label">Risk - Energy Demand</td><td>${pct(data.risk_factors.energy_demand)}%</td></tr>
          <tr><td class="label">AI Insight</td><td>${data.insight}</td></tr>
          <tr><td class="label">AI Recommendation</td><td>${data.recommendation}</td></tr>
          <tr><td class="label">Report Date</td><td>${data.date}</td></tr>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.country_code}_energy_report.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(reportId: string): void {
  const el = document.getElementById(reportId);
  if (!el) return;

  const originalOverflow = document.body.style.overflow;
  const originalPos = el.style.position;
  const originalTop = el.style.top;

  document.body.style.overflow = 'hidden';
  el.style.position = 'absolute';
  el.style.top = '0';
  el.style.left = '0';
  el.style.width = '100%';
  el.style.zIndex = '9999';

  window.print();

  setTimeout(() => {
    document.body.style.overflow = originalOverflow;
    el.style.position = originalPos;
    el.style.top = originalTop;
    el.style.zIndex = '';
  }, 500);
}
