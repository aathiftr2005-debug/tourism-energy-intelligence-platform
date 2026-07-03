import dtData from '@/data/digital-twin.json';
import type { MapLayer, MapMarker, ActiveLayer } from './types';
import { CountryService, EmergencyService } from '@/lib/services';

export const LAYERS: MapLayer[] = dtData.layers as MapLayer[];
export const LAYER_COUNTRY_DATA: Record<ActiveLayer, Record<string, number>> = dtData.layerCountryData as Record<ActiveLayer, Record<string, number>>;
export const DIGITAL_TWIN_DATA: Record<string, any> = dtData.countryData as Record<string, any>;
export const MAP_MARKERS: MapMarker[] = EmergencyService.getMarkers();
export const COUNTRY_POSITIONS = CountryService.getPositions();
export const FLAGS = CountryService.getAll().emojiFlags;

export function getLayerColor(value: number, layer: ActiveLayer): string {
  if (layer === 'renewable' || layer === 'grid') {
    if (value >= 80) return '#10b981';
    if (value >= 60) return '#84cc16';
    if (value >= 40) return '#f59e0b';
    return '#ef4444';
  }
  if (value >= 80) return '#ef4444';
  if (value >= 60) return '#f97316';
  if (value >= 40) return '#f59e0b';
  if (value >= 20) return '#84cc16';
  return '#10b981';
}

export function getLayerGlow(value: number, layer: ActiveLayer): string {
  const color = getLayerColor(value, layer);
  const intensity = Math.min(value / 100, 1);
  return `0 0 ${4 + intensity * 8}px ${color}${Math.round(0.1 + intensity * 0.3).toString(16).padStart(2, '0')}`;
}
