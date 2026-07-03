import energyData from '@/data/energy.json';
import carbonIntensityData from '@/data/carbon-intensity.json';
import { fetchAllEnergy } from '@/lib/api/entsoeClient';
import type { EnergyDataset } from '@/lib/types/energy';
import type { CarbonIntensityDataset, CarbonIntensityZone } from '@/lib/types/carbon';

let liveData: EnergyDataset | null = null;
let jsonData: EnergyDataset | null = null;
let fetchPromise: Promise<void> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 15 * 60 * 1000;

function loadJson(): EnergyDataset {
  if (!jsonData) {
    jsonData = energyData as EnergyDataset;
  }
  return jsonData;
}

function mergeWithJson(
  apiConsumption: Record<string, number> | undefined,
  apiGridHealth: Record<string, number> | undefined
): EnergyDataset {
  const base = loadJson();
  return {
    consumption: { ...base.consumption, ...(apiConsumption || {}) },
    gridHealth: { ...base.gridHealth, ...(apiGridHealth || {}) },
    carbonEmissions: base.carbonEmissions,
    stressScores: base.stressScores,
  };
}

function normalizeGridHealth(data: EnergyDataset): EnergyDataset {
  const clamped: Record<string, number> = {};
  for (const [k, v] of Object.entries(data.gridHealth)) {
    clamped[k] = Math.min(100, Math.max(0, Number(v)));
  }
  return { ...data, gridHealth: clamped };
}

async function refreshFromApi(): Promise<void> {
  try {
    const apiData = await fetchAllEnergy();
    if (apiData && Object.keys(apiData.consumption || {}).length > 0) {
      const merged = mergeWithJson(apiData.consumption, apiData.gridHealth);
      liveData = normalizeGridHealth(merged);
      lastFetchTime = Date.now();
    }
  } catch {
    // Silently fall back to JSON data
  } finally {
    fetchPromise = null;
  }
}

function ensureFreshness(): void {
  const now = Date.now();
  if (liveData && now - lastFetchTime < CACHE_TTL) return;
  if (fetchPromise) return;

  fetchPromise = refreshFromApi();
}

function load(): EnergyDataset {
  if (liveData) {
    ensureFreshness();
    return liveData;
  }

  const json = loadJson();
  liveData = normalizeGridHealth(json);
  lastFetchTime = Date.now();

  if (!fetchPromise) {
    fetchPromise = refreshFromApi();
  }

  return liveData;
}

export const EnergyService = {
  getAll(): EnergyDataset {
    return load();
  },

  getConsumption(code: string): number {
    return load().consumption[code.toUpperCase()] ?? 0;
  },

  getGridHealth(code: string): number {
    return Math.min(100, Math.max(0, Number(load().gridHealth[code.toUpperCase()] ?? 0)));
  },

  getCarbonEmissions(code: string): number {
    return load().carbonEmissions[code.toUpperCase()] ?? 0;
  },

  getStressScore(code: string): { score: number; level: string } | undefined {
    return load().stressScores[code.toUpperCase()];
  },

  invalidateCache(): void {
    liveData = null;
    lastFetchTime = 0;
    fetchPromise = null;
  },

  // ---- Real carbon intensity zone data from carbon_intensity.json ----
  getCarbonIntensityZones(): CarbonIntensityZone[] {
    return (carbonIntensityData as unknown as CarbonIntensityDataset).zones;
  },

  getCarbonIntensityZone(code: string): CarbonIntensityZone | undefined {
    const upper = code.toUpperCase();
    return (carbonIntensityData as unknown as CarbonIntensityDataset).zones.find(z => z.iso2 === upper);
  },

  getActiveZones(): CarbonIntensityZone[] {
    return (carbonIntensityData as unknown as CarbonIntensityDataset).zones.filter(z => z.zone_key !== 'N/A');
  },
};
