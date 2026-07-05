'use client';
import Image from 'next/image';

interface CountryCardProps {
  country: string;
  flagSrc: string;
  stressScore: number;
  status: string;
}

function getStatusColor(score: number): string {
  if (score >= 70) return '#ef4444';
  if (score >= 50) return '#f59e0b';
  if (score >= 30) return '#eab308';
  return '#10b981';
}

function getBadgeClass(score: number): string {
  if (score >= 70) return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (score >= 50) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  if (score >= 30) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-green-500/20 text-green-400 border-green-500/30';
}

export default function CountryCard({ country, flagSrc, stressScore, status }: CountryCardProps) {
  return (
    <div className="glass-card p-4 text-center hover:scale-[1.03] transition-all cursor-pointer group">
      <Image src={flagSrc} alt={`${country} flag`} width={640} height={427} className="w-12 h-auto mx-auto mb-2 object-contain rounded-sm" />
      <h3 className="font-semibold text-sm md:text-base truncate">{country}</h3>
      <div className="my-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div
        className="text-3xl md:text-4xl font-bold"
        style={{ color: getStatusColor(stressScore), textShadow: stressScore >= 70 ? '0 0 20px rgba(239,68,68,0.3)' : 'none' }}
      >
        {Math.round(stressScore)}
      </div>
      <span className={`text-xs px-3 py-1 rounded-full border mt-2 inline-block ${getBadgeClass(stressScore)}`}>
        {status}
      </span>
    </div>
  );
}
