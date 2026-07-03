import renewableData from '@/data/renewable.json';
import gridRegionsData from '@/data/grid-regions.json';
import { fetchAllRenewableData } from '@/lib/api/electricityMapsClient';
import type { RenewableDataset } from '@/lib/types/renewable';
import type { GridRegionsDataset, GridRegion } from '@/lib/types/grid';

let liveData: RenewableDataset | null = null;
let jsonData: RenewableDataset | null = null;
let fetchPromise: Promise<void> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 10 * 60 * 1000;

function loadJson(): RenewableDataset {
  if (!jsonData) {
    jsonData = renewableData as RenewableDataset;
  }
  return jsonData;
}

function mergeWithJson(apiPercentages: Record<string, number> | undefined): RenewableDataset {
  const base = loadJson();
  return {
    percentages: { ...base.percentages, ...(apiPercentages || {}) },
  };
}

async function refreshFromApi(): Promise<void> {
  try {
    const apiData = await fetchAllRenewableData();
    if (apiData && Object.keys(apiData.percentages || {}).length > 0) {
      liveData = mergeWithJson(apiData.percentages);
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

function load(): RenewableDataset {
  if (liveData) {
    ensureFreshness();
    return liveData;
  }

  const json = loadJson();
  liveData = json;
  lastFetchTime = Date.now();

  if (!fetchPromise) {
    fetchPromise = refreshFromApi();
  }

  return liveData;
}

export const RenewableService = {
  getAll(): RenewableDataset {
    return load();
  },

  getPercentage(code: string): number {
    return Math.min(100, Math.max(0, Number(load().percentages[code.toUpperCase()] ?? 0)));
  },

  invalidateCache(): void {
    liveData = null;
    lastFetchTime = 0;
    fetchPromise = null;
  },

  // ---- Real grid region data from grid_regions.csv ----
  getGridRegions(): GridRegion[] {
    return (gridRegionsData as unknown as GridRegionsDataset).grid_regions;
  },

  getGridRegion(code: string): GridRegion | undefined {
    const upper = code.toUpperCase();
    return (gridRegionsData as unknown as GridRegionsDataset).grid_regions.find(r => r.iso2 === upper);
  },

  getActiveGridRegions(): GridRegion[] {
    return (gridRegionsData as unknown as GridRegionsDataset).grid_regions.filter(r => r.eic_code !== 'N/A');
  },
};
