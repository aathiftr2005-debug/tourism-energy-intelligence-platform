export const COUNTRY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  DE: { lat: 51.1657, lon: 10.4515 },
  FR: { lat: 46.6034, lon: 1.8883 },
  ES: { lat: 40.4637, lon: -3.7492 },
  IT: { lat: 41.8719, lon: 12.5674 },
  AT: { lat: 47.5162, lon: 14.5501 },
  GR: { lat: 39.0742, lon: 21.8243 },
  PT: { lat: 39.3999, lon: -8.2245 },
  NL: { lat: 52.1326, lon: 5.2913 },
  BE: { lat: 50.8503, lon: 4.3517 },
  CZ: { lat: 49.8175, lon: 15.473 },
  GB: { lat: 55.3781, lon: -3.436 },
  CH: { lat: 46.8182, lon: 8.2275 },
  SE: { lat: 60.1282, lon: 18.6435 },
  NO: { lat: 60.472, lon: 8.4689 },
  DK: { lat: 56.2639, lon: 9.5018 },
  FI: { lat: 61.9241, lon: 25.7482 },
  IE: { lat: 53.4129, lon: -8.2439 },
  PL: { lat: 51.9194, lon: 19.1451 },
  HU: { lat: 47.1625, lon: 19.5033 },
  RO: { lat: 45.9432, lon: 24.9668 },
  BG: { lat: 42.7339, lon: 25.4858 },
  HR: { lat: 45.1, lon: 15.2 },
  SK: { lat: 48.669, lon: 19.699 },
  SI: { lat: 46.1512, lon: 14.9955 },
  LT: { lat: 55.1694, lon: 23.8813 },
  LV: { lat: 56.8796, lon: 24.6032 },
  EE: { lat: 58.5953, lon: 25.0136 },
  CY: { lat: 35.1264, lon: 33.4299 },
  LU: { lat: 49.8153, lon: 6.1296 },
  MT: { lat: 35.9375, lon: 14.3754 },
};

const WMO_CODES: Record<number, string> = {
  0: 'Clear',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing Rime Fog',
  51: 'Light Drizzle',
  53: 'Moderate Drizzle',
  55: 'Dense Drizzle',
  56: 'Light Freezing Drizzle',
  57: 'Dense Freezing Drizzle',
  61: 'Slight Rain',
  63: 'Moderate Rain',
  65: 'Heavy Rain',
  66: 'Light Freezing Rain',
  67: 'Heavy Freezing Rain',
  71: 'Slight Snow',
  73: 'Moderate Snow',
  75: 'Heavy Snow',
  77: 'Snow Grains',
  80: 'Slight Rain Showers',
  81: 'Moderate Rain Showers',
  82: 'Violent Rain Showers',
  85: 'Slight Snow Showers',
  86: 'Heavy Snow Showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with Slight Hail',
  99: 'Thunderstorm with Heavy Hail',
};

export function getWeatherCondition(wmoCode: number): string {
  return WMO_CODES[wmoCode] ?? 'Unknown';
}

export function getCoordinates(
  countryCode: string
): { lat: number; lon: number } | null {
  return COUNTRY_COORDINATES[countryCode.toUpperCase()] ?? null;
}
