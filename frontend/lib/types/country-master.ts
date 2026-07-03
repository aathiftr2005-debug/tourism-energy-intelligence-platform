export type ISO2Code = string;
export type ISO3Code = string;

export interface Country {
  country_name: string;
  iso2: ISO2Code;
  iso3: ISO3Code;
  capital: string;
  population_2025: number;
  area_km2: number;
  currency: string;
  timezone: string;
  latitude: number;
  longitude: number;
  official_languages: string[];
  eu_member: boolean;
  schengen_member: boolean;
}

export interface EuropeCountriesDataset {
  metadata: {
    dataset_name: string;
    version: string;
    record_count: number;
    last_updated: string;
    source: string;
  };
  countries: Country[];
}
