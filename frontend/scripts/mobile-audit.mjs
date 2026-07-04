import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const VIEWPORTS = [
  { width: 320, height: 568, name: '320' },
  { width: 360, height: 800, name: '360' },
  { width: 375, height: 812, name: '375' },
  { width: 390, height: 844, name: '390' },
  { width: 412, height: 915, name: '412' },
  { width: 768, height: 1024, name: '768' },
];

const PAGES = [
  { path: '/', name: 'dashboard' },
  { path: '/map', name: 'map' },
  { path: '/map', name: 'map-digital-twin', extra: async (page) => {
    // Click the "Digital Twin" button to switch view
    const btn = page.locator('button', { hasText: 'Digital Twin' });
    if (await btn.isVisible()) await btn.click();
    await page.waitForTimeout(1500);
  }},
  { path: '/forecast', name: 'forecast' },
  { path: '/stress', name: 'stress' },
  { path: '/assistant', name: 'assistant' },
  { path: '/simulator', name: 'simulator' },
  { path: '/reports', name: 'reports' },
  { path: '/api-access', name: 'api-access' },
  { path: '/settings', name: 'settings' },
];

async function run() {
  mkdirSync('test-results/screenshots', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.name}x${vp.width < 768 ? vp.height : 1024} ===`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.width < 768 ? vp.height : 1024 },
      deviceScaleFactor: 2,
      isMobile: vp.width < 768,
      hasTouch: vp.width < 768,
    });
    const page = await context.newPage();

    for (const p of PAGES) {
      try {
        await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1500);

        if (p.extra) await p.extra(page);

        // Take screenshot
        await page.screenshot({ path: `test-results/screenshots/${p.name}_${vp.name}.png`, fullPage: true });

        // Check for visible overflow issues
        const issues = [];

        // Check tei-main width (should fill screen on mobile)
        const mainWidth = await page.evaluate(() => {
          const main = document.querySelector('.tei-main');
          if (!main) return null;
          const rect = main.getBoundingClientRect();
          return Math.round(rect.width);
        });

        if (mainWidth && vp.width < 768 && mainWidth < vp.width * 0.85) {
          issues.push(`tei-main too narrow: ${mainWidth}px vs viewport ${vp.width}px`);
        }

        // Check DigitalTwinMap SVG renders nodes
        if (p.name === 'map-digital-twin') {
          const svgCircles = await page.evaluate(() => {
            // Find the main map SVG (viewBox="0 0 100 70"), not icon SVGs
            const allSvgs = document.querySelectorAll('svg');
            for (const svg of allSvgs) {
              const viewBox = svg.getAttribute('viewBox');
              if (viewBox === '0 0 100 70') {
                return svg.querySelectorAll('circle').length;
              }
            }
            return -1; // map SVG not found
          });
          if (svgCircles === -1) {
            issues.push('DigitalTwinMap main SVG not found');
          } else if (svgCircles === 0) {
            issues.push('DigitalTwinMap SVG has zero circles - map not rendering');
          } else {
            console.log(`  DigitalTwinMap: ${svgCircles} SVG circles rendered`);
          }
        }

        // Check for clipped content at the very bottom
        const bottomClip = await page.evaluate(() => {
          const main = document.querySelector('.tei-main');
          if (!main) return false;
          const scrollHeight = main.scrollHeight;
          const clientHeight = main.clientHeight;
          return scrollHeight > clientHeight + 50;
        });

        const status = issues.length === 0 ? 'PASS' : 'FAIL';
        results.push({ viewport: vp.name, page: p.name, status, issues, mainWidth });

        if (issues.length > 0) {
          console.log(`  ${p.name}: ${status} - ${issues.join('; ')}`);
        } else {
          console.log(`  ${p.name}: PASS (main: ${mainWidth}px)`);
        }
      } catch (err) {
        console.log(`  ${p.name}: ERROR - ${err.message}`);
        results.push({ viewport: vp.name, page: p.name, status: 'ERROR', issues: [err.message] });
      }
    }
    await context.close();
  }

  await browser.close();

  console.log('\n========== FINAL SUMMARY ==========');
  let pass = 0, fail = 0;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} [${r.viewport}] ${r.page}: ${r.status}${r.issues.length ? ' - ' + r.issues.join('; ') : ''}`);
    if (r.status === 'PASS') pass++; else fail++;
  }
  console.log(`\nPassed: ${pass}, Failed: ${fail}, Total: ${results.length}`);
  console.log(`Screenshots saved to test-results/screenshots/`);
  process.exit(fail > 0 ? 1 : 0);
}

run();
