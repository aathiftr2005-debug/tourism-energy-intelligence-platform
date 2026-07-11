'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function AnimatedCounter({ value, precision = 0 }: { value: number; precision?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(current);
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value]);

  return <>{display.toFixed(precision)}</>;
}

import data from '@/data/kpis.json';
import type { KpiCard } from '@/lib/types';

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  '#3b82f6': { bg: 'rgba(37,99,235,0.06)', border: 'rgba(37,99,235,0.20)', text: '#2563eb', glow: '0 0 20px rgba(37,99,235,0.08)' },
  '#10b981': { bg: 'rgba(5,150,105,0.06)', border: 'rgba(5,150,105,0.20)', text: '#059669', glow: '0 0 20px rgba(5,150,105,0.08)' },
  '#f59e0b': { bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.20)', text: '#d97706', glow: '0 0 20px rgba(217,119,6,0.08)' },
  '#ef4444': { bg: 'rgba(220,38,38,0.06)', border: 'rgba(220,38,38,0.20)', text: '#dc2626', glow: '0 0 20px rgba(220,38,38,0.08)' },
  '#8b5cf6': { bg: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.20)', text: '#7c3aed', glow: '0 0 20px rgba(124,58,237,0.08)' },
  '#06b6d4': { bg: 'rgba(8,145,178,0.06)', border: 'rgba(8,145,178,0.20)', text: '#0891b2', glow: '0 0 20px rgba(8,145,178,0.08)' },
};

function getColors(color: string) {
  return colorMap[color] || { bg: 'rgba(37,99,235,0.06)', border: 'rgba(37,99,235,0.20)', text: '#2563eb', glow: '0 0 20px rgba(37,99,235,0.08)' };
}

export default function KpiCards() {
  const cards = data.cards as KpiCard[];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {cards.map((card, i) => {
        const c = getColors(card.color);
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 * i }}
            className="rounded-2xl p-4 relative overflow-hidden w-full transition-all duration-300"
            style={{
              background: 'var(--color-card)',
              border: `1px solid ${c.border}`,
              borderLeft: `3px solid ${card.color}`,
              boxShadow: 'var(--light-card-shadow)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--light-card-shadow-md)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--light-card-shadow)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ background: c.bg }} />

            <div className="flex items-center justify-between mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: c.bg }}
              >
                {card.icon}
              </div>
              <span className="text-caption text-[10px] uppercase tracking-wider font-medium truncate max-w-[50%]">
                {card.label.split(' ').pop()}
              </span>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span
                className="text-2xl md:text-3xl font-bold tracking-tight"
                style={{ color: c.text }}
              >
                <AnimatedCounter value={card.value} precision={card.precision} />
              </span>
              {card.suffix && (
                <span className="text-muted text-xs font-medium">{card.suffix}</span>
              )}
            </div>
            <p className="text-caption text-[11px] mt-1 font-medium">
              {card.label}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
