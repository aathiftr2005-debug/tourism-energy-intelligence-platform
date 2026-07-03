export type ISO2Code = string;
export type ISO3Code = string;
export type EICCode = string;

export interface GridRegion {
  country_name: string;
  iso2: ISO2Code;
  iso3: ISO3Code;
  bidding_zone: string;
  region_code: string;
  eic_code: EICCode;
  grid_operator: string;
  entsoe_domain: EICCode;
  frequency: string;
  api_mapping: string;
  notes: string;
}

export interface GridRegionsDataset {
  metadata: {
    dataset_name: string;
    version: string;
    record_count: number;
    last_updated: string;
    source: string;
  };
  grid_regions: GridRegion[];
}

export function hasEntsoeDomain(region: GridRegion): boolean {
  return region.eic_code !== "N/A";
}
