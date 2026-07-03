export interface CountryDigitalTwinData {
  country: string;
  country_code: string;
  energyUsage: number;
  renewablePercent: number;
  touristCount: number;
  carbonEmissions: number;
  weather: { condition: string; temperature: number; humidity: number };
  gridHealth: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  aiSummary: string;
  aiRecommendation: string;
  forecast24h: { label: string; value: string; direction: 'up' | 'down' | 'stable' }[];
}

export interface MapLayer {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export interface MapMarker {
  id: string;
  country: string;
  country_code: string;
  type: 'incident' | 'warning' | 'info';
  label: string;
  x: number;
  y: number;
}

export type ActiveLayer = 'energy' | 'tourism' | 'weather' | 'renewable' | 'grid' | 'incidents' | 'transport';
