export interface Alert {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
}

export interface Risk {
  id: string;
  title: string;
  probability: number;
  level: 'critical' | 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
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

export interface EmergencyDataset {
  alerts: Alert[];
  risks: Risk[];
  recommendations: Recommendation[];
  markers: MapMarker[];
}
