export type ISO2Code = string;
export type ISO3Code = string;
export type ZoneKey = string;

export interface CarbonIntensityZone {
  country_name: string;
  iso2: ISO2Code;
  iso3: ISO3Code;
  zone_key: ZoneKey;
  latest_carbon_intensity_endpoint: string;
  historical_carbon_intensity_endpoint: string;
  power_breakdown_endpoint: string;
  unit: "gCO2eq/kWh" | "N/A";
  update_frequency: string;
  notes: string;
}

export interface CarbonIntensityDataset {
  metadata: {
    dataset_name: string;
    version: string;
    record_count: number;
    last_updated: string;
    source: string;
  };
  zones: CarbonIntensityZone[];
}

export interface ElectricityMapsLatestCarbonIntensity {
  zone: string;
  carbonIntensity: number;
  datetime: string;
  updatedAt: string;
  createdAt: string;
  emissionFactorType: string;
  isEstimated: boolean;
  estimationMethod: string | null;
  temporalGranularity: string;
}

export interface ElectricityMapsPowerBreakdown {
  zone: string;
  datetime: string;
  updatedAt: string;
  createdAt: string;
  powerConsumptionBreakdown: Record<string, number>;
  powerProductionBreakdown: Record<string, number>;
  powerImportBreakdownZoneWise: Record<string, number>;
  powerExportBreakdownZoneWise: Record<string, number>;
  fossilFreePercentage: number;
  renewablePercentage: number;
  powerConsumptionTotal: number;
  powerProductionTotal: number;
  isEstimated: boolean;
}

export function hasElectricityMapsZone(zone: CarbonIntensityZone): boolean {
  return zone.zone_key !== "N/A";
}
