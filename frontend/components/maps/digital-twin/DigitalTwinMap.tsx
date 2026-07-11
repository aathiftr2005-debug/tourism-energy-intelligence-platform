'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CountryDigitalTwinData, ActiveLayer } from './types';
import { DIGITAL_TWIN_DATA, COUNTRY_POSITIONS, MAP_MARKERS, LAYER_COUNTRY_DATA, getLayerColor, getLayerGlow } from './data';
import LayerToggle from './LayerToggle';
import CountryInfoPanel from './CountryInfoPanel';

const MARKER_COLORS: Record<string, string> = {
  incident: '#ef4444',
  warning: '#f59e0b',
  info: '#00d4ff',
};

export default function DigitalTwinMap() {
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('energy');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const selectedData: CountryDigitalTwinData | null = selectedCountry ? DIGITAL_TWIN_DATA[selectedCountry] || null : null;

  const handleCountryClick = (code: string) => {
    setSelectedCountry(code);
  };

  const closePanel = () => {
    setSelectedCountry(null);
  };

  const getCountryLayerValue = (code: string): number => {
    return LAYER_COUNTRY_DATA[activeLayer]?.[code] ?? 0;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-[200px] flex-shrink-0">
        <LayerToggle activeLayer={activeLayer} onLayerChange={setActiveLayer} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="w-full h-[400px] md:h-[600px] min-h-[300px] relative overflow-hidden rounded-2xl" style={{ background: 'var(--color-card-hover)' }}>
          <motion.svg
            viewBox="0 0 100 70"
            className="w-full h-full"
            style={{ background: 'transparent' }}
            preserveAspectRatio="xMidYMid meet"
          >
            {Object.entries(COUNTRY_POSITIONS).map(([country, pos]) => {
              const twinData = DIGITAL_TWIN_DATA[country] || Object.values(DIGITAL_TWIN_DATA).find(d => d.country === country);
              const code = twinData?.country_code || Object.keys(COUNTRY_POSITIONS).find(k => COUNTRY_POSITIONS[k].label === country) || '';
              const layerValue = getCountryLayerValue(code);
              const color = getLayerColor(layerValue, activeLayer);
              const glow = getLayerGlow(layerValue, activeLayer);
              const isHovered = hoveredCountry === country;
              const isSelected = selectedCountry === (twinData?.country_code || '');
              const size = isSelected ? 8 : isHovered ? 7 : 3 + (layerValue / 100) * 4;

              return (
                <g
                  key={country}
                  onClick={() => {
                    if (twinData) handleCountryClick(twinData.country_code);
                  }}
                  onMouseEnter={() => setHoveredCountry(country)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {isHovered && (
                    <>
                      <circle cx={pos.x} cy={pos.y} r={size + 8} fill="rgba(0,212,255,0.06)" className="animate-ping" style={{ animationDuration: '2s' }} />
                      <circle cx={pos.x} cy={pos.y} r={size + 5} fill="rgba(0,212,255,0.1)" />
                    </>
                  )}
                  {isSelected && (
                    <circle cx={pos.x} cy={pos.y} r={size + 10} fill="rgba(0,212,255,0.08)" className="animate-pulse" style={{ animationDuration: '1.5s' }} />
                  )}

                  <motion.circle
                    cx={pos.x}
                    cy={pos.y}
                    r={size}
                    fill={layerValue > 0 ? color : 'var(--color-card)'}
                    stroke={isHovered || isSelected ? 'var(--color-accent)' : layerValue > 0 ? 'var(--color-border)' : 'var(--color-border)'}
                    strokeWidth={isHovered || isSelected ? 2 : 0.5}
                    animate={{ scale: isHovered ? 1.3 : 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{ filter: layerValue > 0 ? `drop-shadow(${glow})` : 'none', transformOrigin: `${pos.x}px ${pos.y}px` }}
                  />

                  <AnimatePresence>
                    {isHovered && (
                      <motion.g
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <rect x={pos.x - 18} y={pos.y - 22} width={36} height={18} rx={4}
                          fill="var(--color-card)" stroke="var(--color-accent-20)" strokeWidth="0.5"
                        />
                        <text x={pos.x} y={pos.y - 10} textAnchor="middle" fill="var(--color-text-heading)" fontSize="3.5" fontWeight="bold">
                          {pos.label}
                        </text>
                      </motion.g>
                    )}
                  </AnimatePresence>
                </g>
              );
            })}

            {activeLayer === 'incidents' && MAP_MARKERS.map((marker) => {
              const mPos = COUNTRY_POSITIONS[marker.country];
              if (!mPos) return null;
              const color = MARKER_COLORS[marker.type];
              const offsetX = (marker.x - 50) * 0.3;
              const offsetY = (marker.y - 50) * 0.3;
              return (
                <g key={marker.id}>
                  <motion.circle
                    cx={mPos.x + offsetX}
                    cy={mPos.y + offsetY}
                    r={3}
                    fill={color}
                    animate={{ r: [3, 5, 3], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                  />
                  <motion.circle
                    cx={mPos.x + offsetX}
                    cy={mPos.y + offsetY}
                    r={6}
                    fill="none"
                    stroke={color}
                    strokeWidth={0.5}
                    animate={{ r: [6, 10, 6], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <text x={mPos.x + offsetX + 4} y={mPos.y + offsetY + 1.2} fill={color} fontSize="2.8" fontWeight="medium" style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.6)', strokeWidth: '0.3px' }}>
                    {marker.label}
                  </text>
                </g>
              );
            })}
          </motion.svg>

          <div className="absolute bottom-4 left-4 p-2.5 rounded-xl" style={{
            background: 'var(--color-card)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--color-border)',
          }}>
            <div className="flex items-center gap-3">
              {[70, 50, 30, 10].map((val) => (
                <div key={val} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{
                    background: getLayerColor(val, activeLayer),
                    boxShadow: `0 0 6px ${getLayerColor(val, activeLayer)}60`,
                  }} />
                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    {val === 70 ? 'High' : val === 50 ? 'Elevated' : val === 30 ? 'Moderate' : 'Low'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-4 right-4 p-2 rounded-xl text-[10px]" style={{
            background: 'var(--color-card)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--color-border)', color: 'var(--color-text-caption)',
          }}>
            {Object.keys(DIGITAL_TWIN_DATA).length} countries monitored
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedData && (
          <CountryInfoPanel
            key={selectedData.country_code}
            data={selectedData}
            onClose={closePanel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
