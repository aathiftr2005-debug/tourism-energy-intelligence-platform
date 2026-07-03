export interface CountryEntry {
  code: string;
  name: string;
}

export interface CountryPosition {
  x: number;
  y: number;
  label: string;
}

export interface CountriesDataset {
  allCountries: CountryEntry[];
  flags: Record<string, string>;
  forecastCountries: string[];
  stressPageCountries: CountryEntry[];
  names: Record<string, string>;
  emojiFlags: Record<string, string>;
  positions: Record<string, CountryPosition>;
}
