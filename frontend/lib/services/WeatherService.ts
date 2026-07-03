import weatherData from '@/data/weather.json';
import weatherStationsData from '@/data/weather-stations.json';
import { fetchAllWeather } from '@/lib/api/openMeteoClient';
import { fetchAirQuality } from '@/lib/api/openAQClient';
import type { WeatherDataset, WeatherCondition } from '@/lib/types/weather';
import type { AirQualityData } from '@/lib/api/openAQClient';
import type { WeatherStationsDataset, WeatherStation } from '@/lib/types/weather-integration';

let liveData: WeatherDataset | null = null;
let jsonData: WeatherDataset | null = null;
let fetchPromise: Promise<void> | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 15 * 60 * 1000;

function loadJson(): WeatherDataset {
  if (!jsonData) {
    jsonData = weatherData as WeatherDataset;
  }
  return jsonData;
}

function mergeWithJson(apiConditions: WeatherDataset['conditions']): WeatherDataset {
  const base = loadJson();
  return {
    conditions: {
      ...base.conditions,
      ...apiConditions,
    },
  };
}

async function refreshFromApi(): Promise<void> {
  try {
    const apiData = await fetchAllWeather();
    if (apiData && Object.keys(apiData.conditions).length > 0) {
      liveData = mergeWithJson(apiData.conditions);
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

function load(): WeatherDataset {
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

export const WeatherService = {
  getAll(): WeatherDataset {
    return load();
  },

  getCondition(code: string): WeatherCondition | undefined {
    return load().conditions[code.toUpperCase()];
  },

  invalidateCache(): void {
    liveData = null;
    lastFetchTime = 0;
    fetchPromise = null;
  },

  async getAirQuality(code: string): Promise<AirQualityData | null> {
    return fetchAirQuality(code);
  },

  // ---- Real weather station data from weather_stations.json ----
  getStations(): WeatherStation[] {
    return (weatherStationsData as unknown as WeatherStationsDataset).stations;
  },

  getStation(code: string): WeatherStation | undefined {
    const iso3Map: Record<string, string> = {
      AT: 'AUT', BE: 'BEL', BG: 'BGR', HR: 'HRV', CY: 'CYP',
      CZ: 'CZE', DK: 'DNK', EE: 'EST', FI: 'FIN', FR: 'FRA',
      DE: 'DEU', GR: 'GRC', HU: 'HUN', IE: 'IRL', IT: 'ITA',
      LV: 'LVA', LT: 'LTU', LU: 'LUX', MT: 'MLT', NL: 'NLD',
      NO: 'NOR', PL: 'POL', PT: 'PRT', RO: 'ROU', SK: 'SVK',
      SI: 'SVN', ES: 'ESP', SE: 'SWE', CH: 'CHE', GB: 'GBR',
    };
    const iso3 = iso3Map[code.toUpperCase()];
    if (!iso3) return undefined;
    return (weatherStationsData as unknown as WeatherStationsDataset).stations.find(
      s => s.country_iso3 === iso3
    );
  },

  getStationById(id: string): WeatherStation | undefined {
    return (weatherStationsData as unknown as WeatherStationsDataset).stations.find(
      s => s.station_id === id
    );
  },
};
