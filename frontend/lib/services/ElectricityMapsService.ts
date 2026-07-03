import type {
  CarbonIntensityZone,
  ElectricityMapsLatestCarbonIntensity,
  ElectricityMapsPowerBreakdown,
} from '@/lib/types/carbon';

export async function fetchLatestCarbonIntensity(
  zone: CarbonIntensityZone,
  _config?: { apiKey: string }
): Promise<ElectricityMapsLatestCarbonIntensity> {
  if (zone.zone_key === 'N/A') {
    throw new Error(
      `${zone.country_name} has no independent Electricity Maps zone (${zone.notes})`
    );
  }

  const response = await fetch(`/api/carbon?zone=${encodeURIComponent(zone.zone_key)}&type=carbon-intensity`);

  if (!response.ok) {
    throw new Error(
      `Carbon intensity request failed for ${zone.country_name} (${zone.zone_key}): ${response.status}`
    );
  }

  return response.json();
}

export async function fetchLatestPowerBreakdown(
  zone: CarbonIntensityZone,
  _config?: { apiKey: string }
): Promise<ElectricityMapsPowerBreakdown> {
  if (zone.zone_key === 'N/A') {
    throw new Error(
      `${zone.country_name} has no independent Electricity Maps zone (${zone.notes})`
    );
  }

  const response = await fetch(`/api/carbon?zone=${encodeURIComponent(zone.zone_key)}&type=breakdown`);

  if (!response.ok) {
    throw new Error(
      `Power breakdown request failed for ${zone.country_name}: ${response.status}`
    );
  }

  return response.json();
}

export async function fetchHistoricalCarbonIntensity(
  zone: CarbonIntensityZone,
  _config?: { apiKey: string },
  _disableEstimations = true
): Promise<{ zone: string; history: ElectricityMapsLatestCarbonIntensity[] }> {
  if (zone.zone_key === 'N/A') {
    throw new Error(
      `${zone.country_name} has no independent Electricity Maps zone (${zone.notes})`
    );
  }

  const response = await fetch(`/api/carbon?zone=${encodeURIComponent(zone.zone_key)}&type=carbon-intensity`);

  if (!response.ok) {
    throw new Error(
      `Carbon intensity history request failed for ${zone.country_name}: ${response.status}`
    );
  }

  return response.json();
}

export async function getCarbonIntensityForZones(
  zones: CarbonIntensityZone[],
  _config?: { apiKey: string },
  concurrency = 5
): Promise<Array<{ zone: CarbonIntensityZone; data: ElectricityMapsLatestCarbonIntensity | null }>> {
  const queryable = zones.filter((z) => z.zone_key !== 'N/A');
  const results: Array<{
    zone: CarbonIntensityZone;
    data: ElectricityMapsLatestCarbonIntensity | null;
  }> = [];

  for (let i = 0; i < queryable.length; i += concurrency) {
    const batch = queryable.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (zone) => {
        try {
          const data = await fetchLatestCarbonIntensity(zone);
          return { zone, data };
        } catch (err) {
          console.error(`Carbon intensity fetch failed for ${zone.country_name}:`, err);
          return { zone, data: null };
        }
      })
    );
    results.push(...batchResults);
  }
  return results;
}
