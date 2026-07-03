import { apiCache, CACHE_TTL } from './cache';
import { COUNTRY_COORDINATES } from './coordinates';
import type {
  Alert,
  Risk,
  Recommendation,
  MapMarker,
  EmergencyDataset,
} from '@/lib/types/emergency';

interface GdacsResponse {
  xml: string;
}

async function internalFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Internal API error: ${response.status}`);
  return response.json();
}

interface GdacsEvent {
  title: string;
  description: string;
  pubDate: string;
  lat: number;
  lon: number;
  eventType: string;
  alertLevel: string;
  country: string;
}

function parseGdacsXml(xml: string): GdacsEvent[] {
  const events: GdacsEvent[] = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const item = itemMatch[1];

    const extract = (tag: string): string => {
      const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`).exec(item);
      return m ? m[1].trim() : '';
    };

    const title = extract('title');
    const description = extract('description');
    const pubDate = extract('pubDate');

    const geoLatMatch = item.match(/<georss:point>([\d.-]+)/);
    const lat = geoLatMatch ? parseFloat(geoLatMatch[1]) : 0;

    const geoLonMatch = item.match(/[\d.-]+\s([\d.-]+)<\/georss:point>/);
    const lon = geoLonMatch ? parseFloat(geoLonMatch[1]) : 0;

    let eventType = 'unknown';
    if (title.toLowerCase().includes('flood')) eventType = 'flood';
    else if (title.toLowerCase().includes('fire')) eventType = 'fire';
    else if (title.toLowerCase().includes('storm') || title.toLowerCase().includes('cyclone'))
      eventType = 'storm';
    else if (title.toLowerCase().includes('earthquake')) eventType = 'earthquake';

    let alertLevel = 'medium';
    if (title.toLowerCase().includes('red') || title.toLowerCase().includes('severe'))
      alertLevel = 'high';
    else if (title.toLowerCase().includes('green')) alertLevel = 'low';

    let country = 'Unknown';
    for (const [code] of Object.entries(COUNTRY_COORDINATES)) {
      if (title.includes(code)) {
        country = code;
        break;
      }
    }

    if (title) {
      events.push({
        title,
        description,
        pubDate,
        lat,
        lon,
        eventType,
        alertLevel,
        country,
      });
    }
  }

  return events;
}

function getCountryCodeFromCoords(
  lat: number,
  lon: number
): string | null {
  if (!lat && !lon) return null;

  let closest: string | null = null;
  let minDist = Infinity;

  for (const [code, coords] of Object.entries(COUNTRY_COORDINATES)) {
    const dist = Math.sqrt(
      Math.pow(lat - coords.lat, 2) + Math.pow(lon - coords.lon, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      closest = code;
    }
  }

  return minDist < 20 ? closest : null;
}

function eventsToEmergencyDataset(events: GdacsEvent[]): EmergencyDataset {
  const alerts: Alert[] = [];
  const risks: Map<string, Risk> = new Map();
  const markers: MapMarker[] = [];

  const disasterCounts: Record<string, number> = {};
  const riskIds = ['flood', 'fire', 'storm', 'earthquake'];

  for (const event of events) {
    const priority = event.alertLevel === 'high' ? 'high' as const
      : event.alertLevel === 'low' ? 'low' as const
      : 'medium' as const;

    const code = event.country || getCountryCodeFromCoords(event.lat, event.lon) || 'EU';

    alerts.push({
      id: `gdacs_${events.indexOf(event)}`,
      priority,
      title: event.title,
      description: event.description,
      timestamp: event.pubDate || new Date().toISOString(),
    });

    disasterCounts[event.eventType] = (disasterCounts[event.eventType] || 0) + 1;

    markers.push({
      id: `m_gdacs_${events.indexOf(event)}`,
      country: code,
      country_code: code,
      type: priority === 'high' ? 'incident' : priority === 'medium' ? 'warning' : 'info',
      label: event.title,
      x: event.lon ? ((event.lon + 25) / 70) * 100 : 50,
      y: event.lat ? ((55 - event.lat) / 50) * 100 : 50,
    });
  }

  for (const riskId of riskIds) {
    const count = disasterCounts[riskId] || 0;
    if (count > 0) {
      const probability = Math.min(95, count * 25);
      const level: 'critical' | 'high' | 'medium' | 'low' =
        probability > 70 ? 'high' : probability > 40 ? 'medium' : 'low';

      risks.set(riskId, {
        id: riskId,
        title: `${riskId.charAt(0).toUpperCase() + riskId.slice(1)} Risk`,
        probability,
        level,
        trend: count > 1 ? 'up' : 'stable',
      });
    }
  }

  const recommendations: Recommendation[] = [
    {
      id: 'gdacs_r1',
      title: 'Monitor GDACS Alerts',
      description: `${events.length} active disaster event(s) detected. Review and prepare response.`,
      impact: 'Timely disaster response',
      priority: events.some((e) => e.alertLevel === 'high') ? 'critical' : 'medium',
    },
  ];

  return {
    alerts,
    risks: Array.from(risks.values()),
    recommendations,
    markers,
  };
}

export async function fetchDisasterAlerts(): Promise<EmergencyDataset> {
  const cacheKey = 'gdacs_alerts';
  const cached = apiCache.get<EmergencyDataset>(cacheKey);
  if (cached) return cached;

  try {
    const response = await internalFetch<GdacsResponse>('/api/emergency');
    const events = parseGdacsXml(response.xml);
    const dataset = eventsToEmergencyDataset(events);

    apiCache.set(cacheKey, dataset, CACHE_TTL.EMERGENCY);
    return dataset;
  } catch {
    return {
      alerts: [],
      risks: [],
      recommendations: [],
      markers: [],
    };
  }
}

export async function fetchDisasterAlertsByCountry(
  countryCode: string
): Promise<EmergencyDataset> {
  const full = await fetchDisasterAlerts();

  return {
    alerts: full.alerts.filter(
      (a) => a.title.toUpperCase().includes(countryCode.toUpperCase())
    ),
    risks: full.risks,
    recommendations: full.recommendations,
    markers: full.markers.filter(
      (m) => m.country_code.toUpperCase() === countryCode.toUpperCase()
    ),
  };
}
