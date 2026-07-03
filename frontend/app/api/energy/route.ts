import { NextResponse } from 'next/server';

const API_KEY = process.env.ENTSOE_API_KEY || '';
const BASE_URL = process.env.ENTSOE_BASE_URL || 'https://web-api.tp.entsoe.eu/api';

const ENTSOE_MAPPING: Record<string, string> = {
  DE: '10Y1001A1001A83F',
  FR: '10YFR-RTE------C',
  ES: '10YES-REE------0',
  IT: '10YIT-GRTN-----B',
  AT: '10YAT-APG------L',
  GR: '10YGR-HTSO-----Y',
  PT: '10YPT-REN------W',
  NL: '10YNL-LUIN-----0',
  BE: '10YBE----------2',
  CZ: '10YCZ-CEPS-----N',
  GB: '10YGB----------A',
  CH: '10YCH-SWISSGRIDZ',
  SE: '10YSE-1--------K',
  NO: '10YNO-0--------C',
  DK: '10YDK-1--------W',
  FI: '10YFI-1--------U',
  IE: '10YIE-1001A00010',
  PL: '10YPL-AREA-----S',
  HU: '10YHU-MAVIR----U',
  RO: '10YRO-TEL------P',
  BG: '10YCA-BULGARIA-R',
  HR: '10YHR-HEP------M',
};

function getDateParam(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const type = searchParams.get('type') || 'load';

    if (!country) {
      return NextResponse.json({ error: 'country is required' }, { status: 400 });
    }

    const domain = ENTSOE_MAPPING[country.toUpperCase()];
    if (!API_KEY || !domain) {
      return NextResponse.json({ error: 'ENTSO-E not configured for this country' }, { status: 501 });
    }

    const now = new Date();
    const start = new Date(now.getTime() - 60 * 60 * 1000);
    const docType = type === 'generation' ? 'A75' : 'A65';

    const url = `${BASE_URL}?securityToken=${API_KEY}&documentType=${docType}&processType=A16&in_Domain=${domain}&out_Domain=${domain}&periodStart=${getDateParam(start)}&periodEnd=${getDateParam(now)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/xml' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `ENTSO-E error: ${response.status}` },
        { status: response.status }
      );
    }

    const xml = await response.text();

    const points: { position: number; quantity: number }[] = [];
    const pointRegex = /<Point>\s*<position>(\d+)<\/position>\s*<quantity>([\d.]+)<\/quantity>\s*<\/Point>/g;
    let match: RegExpExecArray | null;
    while ((match = pointRegex.exec(xml)) !== null) {
      points.push({ position: parseInt(match[1], 10), quantity: parseFloat(match[2]) });
    }

    return NextResponse.json({ points, country: country.toUpperCase(), type });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
