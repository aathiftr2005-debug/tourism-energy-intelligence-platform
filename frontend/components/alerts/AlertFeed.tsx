'use client';

import { COUNTRY_FLAGS, COUNTRY_NAMES } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';

interface Props {
  data: { country_code?: string; country?: string; stress_score: number; stress_level?: string; recommendation?: string }[];
}

function getFlag(code: string): string {
  return COUNTRY_FLAGS[code.toUpperCase()] || '🏳️';
}

function getName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] || code;
}

export default function AlertFeed({ data }: Props) {
  const alerts = data
    .filter((d) => (d.stress_score ?? 0) >= 50)
    .sort((a, b) => (b.stress_score ?? 0) - (a.stress_score ?? 0));

  return (
    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
      {alerts.length === 0 && (
        <div className="flex items-center justify-center h-48 text-caption">
          ✅ No active alerts
        </div>
      )}
      {alerts.map((alert) => {
        const code = alert.country_code || alert.country || '';
        const score = alert.stress_score ?? 0;
        const isCritical = score >= 70;
        return (
          <div
            key={code}
            className="flex items-start gap-3 p-3 rounded-xl border transition-all"
            style={{
              background: isCritical ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.06)',
              borderColor: isCritical ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)',
            }}
          >
            {isCritical ? (
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#ef4444' }} />
            ) : (
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#f59e0b' }} />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getFlag(code)}</span>
                <span className="font-semibold text-sm">{getName(code)}</span>
                <span className={`ml-auto text-sm font-bold ${isCritical ? 'text-red-400' : 'text-orange-400'}`}>
                  {Math.round(score)}
                </span>
              </div>
              <p className="text-caption text-xs mt-1 truncate">
                {alert.recommendation || (isCritical ? 'Immediate attention required' : 'Monitor closely')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
