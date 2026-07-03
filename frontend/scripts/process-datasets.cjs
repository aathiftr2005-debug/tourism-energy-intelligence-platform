/**
 * Data Processing Script
 * Converts raw datasets from D:\eu data into the project's format
 */

const fs = require('fs');
const path = require('path');

const EU_DATA_DIR = 'D:\\eu data';
const DATA_OUT_DIR = path.join(__dirname, '..', 'data');
const LIB_TYPES_DIR = path.join(__dirname, '..', 'lib', 'types');
const LIB_SERVICES_DIR = path.join(__dirname, '..', 'lib', 'services');

// Ensure output directories exist
[DATA_OUT_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ---------- Validation helpers ----------
const warnings = [];
function warn(msg) { warnings.push(msg); console.warn('  [WARN]', msg); }

// ---------- 1. Process europe_countries_master.csv → countries.json ----------
function processCountries() {
  console.log('\n=== Processing europe_countries_master.csv ===');
  const csvPath = path.join(EU_DATA_DIR, 'europe_countries_master.csv');
  if (!fs.existsSync(csvPath)) { warn('File not found: ' + csvPath); return null; }

  const csv = fs.readFileSync(csvPath, 'utf-8').trim();
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = lines.slice(1).filter(l => l.trim());

  const allCountries = [];
  const names = {};
  const emojiFlags = {};
  const positions = {};
  const capitals = {};
  const populations = {};
  const areas = {};
  const currencies = {};
  const timezones = {};
  const euMembers = {};
  const schengenMembers = {};
  const languages = {};
  const coordinates = {};

  let validCount = 0;
  for (const row of rows) {
    const cols = row.split(',');
    if (cols.length < headers.length) {
      warn(`Skipping malformed row (${cols.length} cols, expected ${headers.length}): ${row.substring(0, 60)}`);
      continue;
    }
    const entry = {};
    headers.forEach((h, i) => { entry[h] = cols[i]?.trim(); });

    const code = entry.iso2?.toUpperCase();
    const name = entry.country_name;
    if (!code || !name || code.length !== 2) {
      warn(`Skipping row with invalid iso2: ${row.substring(0, 60)}`);
      continue;
    }

    allCountries.push({ code, name });
    names[code] = name;

    // Capital
    if (entry.capital) capitals[code] = entry.capital;

    // Population & area
    const pop = parseInt(entry.population_2025);
    if (!isNaN(pop)) populations[code] = pop;
    const area = parseInt(entry.area_km2);
    if (!isNaN(area)) areas[code] = area;

    // Currency, timezone, languages
    if (entry.currency) currencies[code] = entry.currency;
    if (entry.timezone) timezones[code] = entry.timezone;
    if (entry.official_languages) languages[code] = entry.official_languages.split(';');

    // EU & Schengen membership
    euMembers[code] = entry.eu_member === 'true';
    schengenMembers[code] = entry.schengen_member === 'true';

    // Coordinates → positions
    const lat = parseFloat(entry.latitude);
    const lng = parseFloat(entry.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      coordinates[code] = { lat, lng };
      // Convert lat/lng to x,y for the map projection (simplified)
      positions[name] = {
        x: Math.round((lng + 25) * 1.8),
        y: Math.round((55 - lat) * 1.2),
        label: name
      };
    }

    // Emoji flag from ISO2 code
    const flagOffset = 0x1F1E6 - 65;
    if (code.length === 2) {
      const c1 = code.charCodeAt(0) - 65 + flagOffset;
      const c2 = code.charCodeAt(1) - 65 + flagOffset;
      if (c1 >= 0 && c1 <= 25 && c2 >= 0 && c2 <= 25) {
        emojiFlags[code] = String.fromCodePoint(c1) + String.fromCodePoint(c2);
      }
    }

    validCount++;
  }

  // Build forecastCountries (EU members with significant tourism)
  const forecastCountries = allCountries
    .filter(c => euMembers[c.code])
    .map(c => c.code);

  // Build stressPageCountries (subset of tracked countries)
  const stressPageCountries = allCountries
    .filter(c => euMembers[c.code] || c.code === 'GB' || c.code === 'NO' || c.code === 'CH')
    .slice(0, 10)
    .map(c => ({ code: c.code, name: c.name }));

  // Build flags (keep path convention)
  const flags = {};
  allCountries.forEach(c => {
    flags[c.code] = `/images/flags/flag-${c.name.toLowerCase().replace(/\s+/g, '-')}.png`;
  });

  console.log(`  Valid countries: ${validCount}/${rows.length}`);
  console.log(`  Warnings: ${warnings.length}`);

  return {
    allCountries,
    flags,
    forecastCountries,
    stressPageCountries,
    names,
    emojiFlags,
    positions,
    capitals,
    populations,
    areas,
    currencies,
    timezones,
    euMembers,
    schengenMembers,
    languages,
    coordinates
  };
}

// ---------- 2. Process carbon_intensity.json ----------
function processCarbonIntensity() {
  console.log('\n=== Processing carbon_intensity.json ===');
  const jsonPath = path.join(EU_DATA_DIR, 'carbon_intensity.json');
  if (!fs.existsSync(jsonPath)) { warn('File not found: ' + jsonPath); return null; }

  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    if (!data.carbon_intensity_zones || !Array.isArray(data.carbon_intensity_zones)) {
      warn('carbon_intensity.json: missing carbon_intensity_zones array');
      return null;
    }

    // Validate each zone
    const zones = data.carbon_intensity_zones.filter(z => {
      if (!z.iso2 || !z.country_name) {
        warn(`carbon_intensity.json: skipping zone missing iso2/country_name`);
        return false;
      }
      return true;
    });

    console.log(`  Valid zones: ${zones.length}/${data.carbon_intensity_zones.length}`);

    return {
      metadata: {
        dataset_name: data.metadata?.dataset_name || 'European Carbon Intensity Zones',
        version: data.metadata?.version || '1.0.0',
        record_count: zones.length,
        last_updated: data.metadata?.last_updated || '2026-07-03',
        source: data.metadata?.source || 'Electricity Maps API v3'
      },
      zones: zones.map(z => ({
        country_name: z.country_name,
        iso2: z.iso2,
        iso3: z.iso3,
        zone_key: z.zone_key,
        latest_carbon_intensity_endpoint: z.latest_carbon_intensity_endpoint,
        historical_carbon_intensity_endpoint: z.historical_carbon_intensity_endpoint,
        power_breakdown_endpoint: z.power_breakdown_endpoint,
        unit: z.unit,
        update_frequency: z.update_frequency,
        notes: z.notes
      }))
    };
  } catch (e) {
    warn(`carbon_intensity.json parse error: ${e.message}`);
    return null;
  }
}

// ---------- 3. Process grid_regions.csv ----------
function processGridRegions() {
  console.log('\n=== Processing grid_regions.csv ===');
  const csvPath = path.join(EU_DATA_DIR, 'grid_regions.csv');
  if (!fs.existsSync(csvPath)) { warn('File not found: ' + csvPath); return null; }

  const csv = fs.readFileSync(csvPath, 'utf-8').trim();
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = lines.slice(1).filter(l => l.trim());

  const regions = [];
  for (const row of rows) {
    const cols = row.split(',');
    if (cols.length < 8) {
      warn(`grid_regions.csv: Skipping malformed row (${cols.length} cols)`);
      continue;
    }
    const entry = {};
    headers.forEach((h, i) => { entry[h] = cols[i]?.trim(); });

    regions.push({
      country_name: entry.country_name || '',
      iso2: (entry.iso2 || '').toUpperCase(),
      iso3: (entry.iso3 || '').toUpperCase(),
      bidding_zone: entry.bidding_zone || 'N/A',
      region_code: entry.region_code || 'N/A',
      eic_code: entry.eic_code || 'N/A',
      grid_operator: entry.grid_operator || 'N/A',
      entsoe_domain: entry.entsoe_domain || 'N/A',
      frequency: entry.frequency || '50 Hz (nominal)',
      api_mapping: entry.api_mapping || 'N/A',
      notes: entry.notes || ''
    });
  }

  console.log(`  Grid regions: ${regions.length}/${rows.length}`);
  return {
    metadata: {
      dataset_name: 'European Grid Regions (ENTSO-E)',
      version: '1.0.0',
      record_count: regions.length,
      last_updated: '2026-07-03',
      source: 'ENTSO-E Transparency Platform'
    },
    grid_regions: regions
  };
}

// ---------- 4. Process weather_stations.json ----------
function processWeatherStations() {
  console.log('\n=== Processing weather_stations.json ===');
  const jsonPath = path.join(EU_DATA_DIR, 'weather_stations.json');
  if (!fs.existsSync(jsonPath)) { warn('File not found: ' + jsonPath); return null; }

  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    if (!data.stations || !Array.isArray(data.stations)) {
      warn('weather_stations.json: missing stations array');
      return null;
    }

    const stations = data.stations.filter(s => {
      if (!s.station_id || !s.country_iso3) {
        warn(`weather_stations.json: skipping station missing id/iso3`);
        return false;
      }
      return true;
    });

    console.log(`  Valid stations: ${stations.length}/${data.stations.length}`);

    return {
      metadata: {
        dataset_name: data.metadata?.dataset_name || 'Europe Weather Stations',
        version: data.metadata?.version || '1.0.0',
        record_count: stations.length,
        last_updated: data.metadata?.last_updated || '2026-07-03',
        source: data.metadata?.source || 'Open-Meteo'
      },
      stations: stations.map(s => ({
        station_id: s.station_id,
        country_name: s.country_name,
        country_iso3: s.country_iso3,
        city: s.city,
        latitude: s.latitude,
        longitude: s.longitude,
        elevation_m: s.elevation_m,
        openmeteo_endpoint: s.openmeteo_endpoint
      }))
    };
  } catch (e) {
    warn(`weather_stations.json parse error: ${e.message}`);
    return null;
  }
}

// ---------- 5. Process boundary_metadata.json ----------
function processBoundaryMetadata() {
  console.log('\n=== Processing boundary_metadata.json ===');
  const jsonPath = path.join(EU_DATA_DIR, 'boundary_metadata.json');
  if (!fs.existsSync(jsonPath)) { warn('File not found: ' + jsonPath); return null; }

  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    if (!data.countries || !Array.isArray(data.countries)) {
      warn('boundary_metadata.json: missing countries array');
      return null;
    }

    console.log(`  Countries in boundary metadata: ${data.countries.length}`);
    return data;
  } catch (e) {
    warn(`boundary_metadata.json parse error: ${e.message}`);
    return null;
  }
}

// ---------- 6. Copy europe_countries.geojson ----------
function copyGeoJSON() {
  console.log('\n=== Copying europe_countries.geojson ===');
  const src = path.join(EU_DATA_DIR, 'europe_countries.geojson');
  const dst = path.join(DATA_OUT_DIR, 'europe-countries.geojson');
  if (!fs.existsSync(src)) { warn('File not found: ' + src); return false; }

  try {
    const content = fs.readFileSync(src, 'utf-8');
    JSON.parse(content); // validate
    fs.writeFileSync(dst, content, 'utf-8');
    console.log('  Copied successfully (valid GeoJSON)');
    return true;
  } catch (e) {
    warn(`europe_countries.geojson validation error: ${e.message}`);
    return false;
  }
}

// ---------- Build updated countries.json with enriched data ----------
function buildCountriesJSON(countriesData) {
  if (!countriesData) return null;

  return {
    allCountries: countriesData.allCountries,
    flags: countriesData.flags,
    forecastCountries: countriesData.forecastCountries,
    stressPageCountries: countriesData.stressPageCountries,
    names: countriesData.names,
    emojiFlags: countriesData.emojiFlags,
    positions: countriesData.positions,
    // New enriched fields from real data
    capitals: countriesData.capitals,
    populations: countriesData.populations,
    areas: countriesData.areas,
    currencies: countriesData.currencies,
    timezones: countriesData.timezones,
    euMembers: countriesData.euMembers,
    schengenMembers: countriesData.schengenMembers,
    languages: countriesData.languages,
    coordinates: countriesData.coordinates
  };
}

// ---------- Main ----------
function main() {
  console.log('========================================');
  console.log('Tourism Energy Intelligence Platform');
  console.log('Data Processing Pipeline');
  console.log('========================================\n');

  // 1. Countries
  const countriesData = processCountries();
  if (countriesData) {
    const result = buildCountriesJSON(countriesData);
    if (result) {
      fs.writeFileSync(path.join(DATA_OUT_DIR, 'countries.json'), JSON.stringify(result, null, 2), 'utf-8');
      console.log('  ✓ Written: data/countries.json');
    }
  }

  // 2. Carbon Intensity
  const carbonData = processCarbonIntensity();
  if (carbonData) {
    fs.writeFileSync(path.join(DATA_OUT_DIR, 'carbon-intensity.json'), JSON.stringify(carbonData, null, 2), 'utf-8');
    console.log('  ✓ Written: data/carbon-intensity.json');
  }

  // 3. Grid Regions
  const gridData = processGridRegions();
  if (gridData) {
    fs.writeFileSync(path.join(DATA_OUT_DIR, 'grid-regions.json'), JSON.stringify(gridData, null, 2), 'utf-8');
    console.log('  ✓ Written: data/grid-regions.json');
  }

  // 4. Weather Stations
  const stationsData = processWeatherStations();
  if (stationsData) {
    fs.writeFileSync(path.join(DATA_OUT_DIR, 'weather-stations.json'), JSON.stringify(stationsData, null, 2), 'utf-8');
    console.log('  ✓ Written: data/weather-stations.json');
  }

  // 5. Boundary Metadata
  const boundaryData = processBoundaryMetadata();
  if (boundaryData) {
    fs.writeFileSync(path.join(DATA_OUT_DIR, 'boundary-metadata.json'), JSON.stringify(boundaryData, null, 2), 'utf-8');
    console.log('  ✓ Written: data/boundary-metadata.json');
  }

  // 6. GeoJSON
  copyGeoJSON();

  // Summary
  console.log('\n========================================');
  console.log('Processing Complete');
  console.log('========================================');
  if (warnings.length > 0) {
    console.log(`\nWarnings (${warnings.length}):`);
    warnings.forEach(w => console.log(`  - ${w}`));
  } else {
    console.log('\nNo warnings.');
  }
}

main();
