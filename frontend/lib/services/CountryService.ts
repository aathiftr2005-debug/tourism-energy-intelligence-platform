import countriesData from '@/data/countries.json';
import stressScoresData from '@/data/stress-scores.json';
import type { CountriesDataset, CountryEntry } from '@/lib/types/countries';
import type { StressScoreEntry } from '@/lib/types';

let instance: CountriesDataset | null = null;

function load(): CountriesDataset {
  if (instance) return instance;
  instance = countriesData as unknown as CountriesDataset;
  return instance;
}

function validate(data: CountriesDataset): void {
  if (!data.allCountries?.length) throw new Error('CountryService: allCountries is empty');
  if (!Object.keys(data.flags).length) throw new Error('CountryService: flags is empty');
}

function normalize(data: CountriesDataset): CountriesDataset {
  return {
    ...data,
    allCountries: data.allCountries.map((c) => ({
      code: String(c.code).toUpperCase(),
      name: String(c.name),
    })),
  };
}

export const CountryService = {
  getAllCountries(): CountryEntry[] {
    return load().allCountries;
  },

  getAll(): CountriesDataset {
    const raw = load();
    validate(raw);
    return normalize(raw);
  },

  getFlagPath(code: string): string {
    return load().flags[code.toUpperCase()] || '';
  },

  getEmojiFlag(code: string): string {
    return load().emojiFlags[code.toUpperCase()] || '';
  },

  getName(code: string): string {
    return load().names[code.toUpperCase()] || code;
  },

  getForecastCountries(): string[] {
    return load().forecastCountries;
  },

  getStressPageCountries(): CountryEntry[] {
    return load().stressPageCountries;
  },

  getPositions(): Record<string, { x: number; y: number; label: string }> {
    return load().positions;
  },

  getDashboardStressScores(): StressScoreEntry[] {
    return (stressScoresData as { dashboard: StressScoreEntry[] }).dashboard;
  },

  getMapStressScores(): StressScoreEntry[] {
    return (stressScoresData as { map: StressScoreEntry[] }).map;
  },

  // ---- Real enriched data from europe_countries_master.csv ----
  getCapital(code: string): string | undefined {
    return (load() as Record<string, any>).capitals?.[code.toUpperCase()];
  },

  getPopulation(code: string): number | undefined {
    return (load() as Record<string, any>).populations?.[code.toUpperCase()];
  },

  getArea(code: string): number | undefined {
    return (load() as Record<string, any>).areas?.[code.toUpperCase()];
  },

  getCurrency(code: string): string | undefined {
    return (load() as Record<string, any>).currencies?.[code.toUpperCase()];
  },

  getTimezone(code: string): string | undefined {
    return (load() as Record<string, any>).timezones?.[code.toUpperCase()];
  },

  isEuMember(code: string): boolean | undefined {
    return (load() as Record<string, any>).euMembers?.[code.toUpperCase()];
  },

  isSchengenMember(code: string): boolean | undefined {
    return (load() as Record<string, any>).schengenMembers?.[code.toUpperCase()];
  },

  getLanguages(code: string): string[] | undefined {
    return (load() as Record<string, any>).languages?.[code.toUpperCase()];
  },

  getCoordinates(code: string): { lat: number; lng: number } | undefined {
    return (load() as Record<string, any>).coordinates?.[code.toUpperCase()];
  },

  getCountryDetails(code: string): Record<string, any> | undefined {
    const c = code.toUpperCase();
    const d = load() as Record<string, any>;
    return {
      code: c,
      name: d.names?.[c],
      capital: d.capitals?.[c],
      population: d.populations?.[c],
      area: d.areas?.[c],
      currency: d.currencies?.[c],
      timezone: d.timezones?.[c],
      euMember: d.euMembers?.[c],
      schengenMember: d.schengenMembers?.[c],
      languages: d.languages?.[c],
      coordinates: d.coordinates?.[c],
      emojiFlag: d.emojiFlags?.[c],
    };
  },
};
