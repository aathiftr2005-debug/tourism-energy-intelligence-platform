import emergencyData from '@/data/emergency.json';
import { fetchDisasterAlerts } from '@/lib/api/gdacsClient';
import type { EmergencyDataset, Alert, Risk, Recommendation, MapMarker } from '@/lib/types/emergency';

let liveData: EmergencyDataset | null = null;
let jsonData: EmergencyDataset | null = null;
let fetchPromise: Promise<void> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

function loadJson(): EmergencyDataset {
  if (!jsonData) {
    jsonData = emergencyData as EmergencyDataset;
  }
  return jsonData;
}

function mergeWithJson(apiData: EmergencyDataset | null): EmergencyDataset {
  const base = loadJson();

  if (!apiData || (!apiData.alerts.length && !apiData.risks.length && !apiData.recommendations.length && !apiData.markers.length)) {
    return base;
  }

  const apiAlertIds = new Set(apiData.alerts.map((a) => a.id));
  const apiRiskIds = new Set(apiData.risks.map((r) => r.id));
  const apiRecIds = new Set(apiData.recommendations.map((r) => r.id));
  const apiMarkerIds = new Set(apiData.markers.map((m) => m.id));

  return {
    alerts: [...apiData.alerts, ...base.alerts.filter((a) => !apiAlertIds.has(a.id))],
    risks: [...apiData.risks, ...base.risks.filter((r) => !apiRiskIds.has(r.id))],
    recommendations: [
      ...apiData.recommendations,
      ...base.recommendations.filter((r) => !apiRecIds.has(r.id)),
    ],
    markers: [...apiData.markers, ...base.markers.filter((m) => !apiMarkerIds.has(m.id))],
  };
}

function normalize(data: EmergencyDataset): EmergencyDataset {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return {
    ...data,
    alerts: [...data.alerts].sort(
      (a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
    ),
  };
}

async function refreshFromApi(): Promise<void> {
  try {
    const apiData = await fetchDisasterAlerts();
    const merged = mergeWithJson(apiData);
    liveData = normalize(merged);
    lastFetchTime = Date.now();
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

function load(): EmergencyDataset {
  if (liveData) {
    ensureFreshness();
    return liveData;
  }

  const json = loadJson();
  liveData = normalize(json);
  lastFetchTime = Date.now();

  if (!fetchPromise) {
    fetchPromise = refreshFromApi();
  }

  return liveData;
}

export const EmergencyService = {
  getAll(): EmergencyDataset {
    return load();
  },

  getAlerts(): Alert[] {
    return load().alerts;
  },

  getSortedAlerts(): Alert[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 } as const;
    return [...load().alerts].sort(
      (a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
    );
  },

  getRisks(): Risk[] {
    return load().risks;
  },

  getRecommendations(): Recommendation[] {
    return load().recommendations;
  },

  getMarkers(): MapMarker[] {
    return load().markers;
  },

  invalidateCache(): void {
    liveData = null;
    lastFetchTime = 0;
    fetchPromise = null;
  },
};
