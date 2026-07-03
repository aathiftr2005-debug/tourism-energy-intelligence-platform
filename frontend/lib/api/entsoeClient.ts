import { apiCache, CACHE_TTL } from './cache';
import type { EnergyDataset } from '@/lib/types/energy';

interface EntsoeApiResponse {
  points: { position: number; quantity: number }[];
  country: string;
  type: string;
}

async function internalFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Internal API error: ${response.status}`);
  return response.json();
}

async function fetchLoad(
  countryCode: string
): Promise<{ consumption: number; gridHealth: number } | null> {
  try {
    const url = `/api/energy?country=${countryCode}&type=load`;
    const data = await internalFetch<EntsoeApiResponse>(url);

    if (!data.points || data.points.length === 0) return null;

    const totalMW = data.points.reduce((sum, p) => sum + p.quantity, 0);
    const avgMW = totalMW / data.points.length;
    const peakMW = Math.max(...data.points.map((p) => p.quantity));

    const gridHealth = Math.min(
      100,
      Math.max(0, Math.round(100 - (avgMW / (peakMW || 1)) * 30))
    );

    return { consumption: Math.round(avgMW * 100) / 100, gridHealth };
  } catch {
    return null;
  }
}

export async function fetchEnergyData(
  countryCode: string
): Promise<{
  consumption: number;
  gridHealth: number;
} | null> {
  const cacheKey = `energy_${countryCode}`;
  const cached = apiCache.get<{
    consumption: number;
    gridHealth: number;
  }>(cacheKey);
  if (cached) return cached;

  const result = await fetchLoad(countryCode);
  if (result) {
    apiCache.set(cacheKey, result, CACHE_TTL.ENERGY);
  }
  return result;
}

export async function fetchAllEnergy(): Promise<Partial<EnergyDataset>> {
  const cacheKey = 'energy_all';
  const cached = apiCache.get<Partial<EnergyDataset>>(cacheKey);
  if (cached) return cached;

  const codes = [
    'DE', 'FR', 'ES', 'IT', 'AT', 'GR', 'PT', 'NL', 'BE', 'CZ',
    'GB', 'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PL', 'HU', 'RO',
    'BG', 'HR',
  ];

  const results = await Promise.allSettled(
    codes.map(async (code) => {
      const data = await fetchLoad(code);
      return { code, data };
    })
  );

  const consumption: Record<string, number> = {};
  const gridHealth: Record<string, number> = {};

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.data) {
      consumption[result.value.code] = result.value.data.consumption;
      gridHealth[result.value.code] = result.value.data.gridHealth;
    }
  }

  const dataset: Partial<EnergyDataset> = { consumption, gridHealth };
  apiCache.set(cacheKey, dataset, CACHE_TTL.ENERGY);
  return dataset;
}
