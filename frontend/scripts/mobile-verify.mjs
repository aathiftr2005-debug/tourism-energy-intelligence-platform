import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const VIEWPORTS = [
  { width: 320, height: 568, name: '320' },
  { width: 375, height: 812, name: '375' },
  { width: 390, height: 844, name: '390' },
  { width: 412, height: 915, name: '412' },
  { width: 768, height: 1024, name: '768' },
];

const PAGES = [
  { path: '/', name: 'dashboard' },
  { path: '/map', name: 'map' },
  { path: '/map', name: 'map-digital-twin', extra: async (page) => {
    const btn = page.locator('button', { hasText: 'Digital Twin' });
    if (await btn.isVisible()) await btn.click();
    await page.waitForTimeout(2000);
  }},
  { path: '/forecast', name: 'forecast' },
  { path: '/stress', name: 'stress' },
  { path: '/assistant', name: 'assistant' },
  { path: '/simulator', name: 'simulator' },
  { path: '/reports', name: 'reports' },
  { path: '/api-access', name: 'api-access' },
  { path: '/settings', name: 'settings' },
];

function formatErrors(errors) {
  return errors.map(e => `${e.type}: ${e.message}`).join('\n');
}

async function run() {
  const outDir = 'test-results/mobile-verify';
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const allResults = [];
  const allConsoleErrors = [];
  const allHydrationErrors = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.name}x${vp.height} ===`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: vp.width < 768,
      hasTouch: vp.width < 768,
    });
    const page = await context.newPage();

    // Collect console errors
    const consoleErrors = [];
    const hydrationErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({ type: 'console', message: msg.text() });
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push({ type: 'page', message: err.message });
    });

    for (const p of PAGES) {
      const pageIssues = [];

      try {
        await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(2000);

        if (p.extra) await p.extra(page);
        await page.waitForTimeout(500);

        // Screenshot
        const ssPath = `${outDir}/${p.name}_${vp.name}.png`;
        await page.screenshot({ path: ssPath, fullPage: true });

        // ── 1. No horizontal scrolling ──
        const hScroll = await page.evaluate(() => {
          return {
            docWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
            vpWidth: window.innerWidth,
            overflow: document.body.scrollWidth > window.innerWidth,
          };
        });
        if (hScroll.overflow) {
          pageIssues.push(`Horizontal scroll: doc=${hScroll.docWidth}px > vp=${hScroll.vpWidth}px`);
        }

        // ── 2. No clipped content ──
        const clipped = await page.evaluate(() => {
          const results = [];
          const important = document.querySelectorAll('.tei-main, .glass-card, main, section, .kpi-card, .grid > div');
          for (const el of important) {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            if (style.overflow === 'hidden' || style.overflowX === 'hidden') {
              // Check if any child extends beyond
              const children = el.querySelectorAll('*');
              for (const child of children) {
                const childRect = child.getBoundingClientRect();
                if (childRect.right > rect.right + 1 && childRect.left >= rect.left) {
                  results.push({ parent: el.tagName, child: child.tagName, diff: childRect.right - rect.right });
                  break;
                }
              }
            }
          }
          return results;
        });
        if (clipped.length > 0) {
          pageIssues.push(`Clipped content: ${clipped.length} instances`);
        }

        // ── 3. Last content fully visible ──
        const lastItem = await page.evaluate(() => {
          const main = document.querySelector('.tei-main') || document.querySelector('main');
          if (!main) return { ok: true };
          const scrollRect = main.getBoundingClientRect();
          const children = main.querySelectorAll(':scope > *');
          if (children.length === 0) return { ok: true };
          const last = children[children.length - 1];
          const lastRect = last.getBoundingClientRect();
          return {
            ok: lastRect.bottom <= window.innerHeight + 100,
            lastBottom: lastRect.bottom,
            windowHeight: window.innerHeight,
          };
        });
        if (!lastItem.ok) {
          pageIssues.push(`Last element clipped: bottom=${lastItem.lastBottom} > h=${lastItem.windowHeight}`);
        }

        // ── 4. Touch targets at least 44px ──
        const smallTargets = await page.evaluate(() => {
          const small = [];
          const interactive = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
          for (const el of interactive) {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            const w = parseFloat(style.width) || rect.width;
            const h = parseFloat(style.height) || rect.height;
            if (w < 44 && h < 44 && el.textContent.trim().length > 0 && !el.closest('.overflow-x-auto')) {
              small.push({ tag: el.tagName, text: el.textContent.trim().slice(0, 20), w: Math.round(w), h: Math.round(h) });
            }
          }
          return small.slice(0, 10);
        });
        if (smallTargets.length > 0) {
          pageIssues.push(`Small touch targets: ${smallTargets.length} (e.g. ${smallTargets[0].tag} "${smallTargets[0].text}" ${smallTargets[0].w}x${smallTargets[0].h}px)`);
        }

        // ── 5. Map-specific checks ──
        if (p.name === 'map-digital-twin') {
          const dtChecks = await page.evaluate(() => {
            // Check circles exist
            const allSvgs = document.querySelectorAll('svg');
            let circles = 0;
            for (const svg of allSvgs) {
              const vb = svg.getAttribute('viewBox');
              if (vb === '0 0 100 70') {
                circles = svg.querySelectorAll('circle').length;
                break;
              }
            }
            // Check map visibility in viewport
            const mapEl = document.querySelector('.glass-card') || allSvgs[0]?.closest('div');
            let mapVisible = false;
            if (mapEl) {
              const r = mapEl.getBoundingClientRect();
              mapVisible = r.top < window.innerHeight && r.bottom > 0;
            }
            return { circles, mapVisible };
          });
          if (dtChecks.circles === -1) pageIssues.push('DigitalTwinMap main SVG not found');
          else if (dtChecks.circles === 0) pageIssues.push('DigitalTwinMap has zero circles');
          else console.log(`  DigitalTwinMap: ${dtChecks.circles} circles, visible: ${dtChecks.mapVisible}`);
          if (!dtChecks.mapVisible) pageIssues.push('DigitalTwinMap not in viewport');
        }

        if (p.name === 'map' || p.name === 'map-digital-twin') {
          const mapChecks = await page.evaluate(() => {
            const imgs = document.querySelectorAll('img[alt*="map" i], img[src*="map" i], img[src*="europe" i]');
            let europeMapOk = false;
            for (const img of imgs) {
              const r = img.getBoundingClientRect();
              if (r.width > 100 && r.height > 100) {
                europeMapOk = true;
                break;
              }
            }
            return { europeMapOk, totalMapImgs: imgs.length };
          });
          if (!mapChecks.europeMapOk) {
            console.log(`  Europe map check: ${mapChecks.europeMapOk} (${mapChecks.totalMapImgs} img tags)`);
          }
        }

        // ── 6. Sidebar menu check ──
        if (p.name === 'dashboard' || p.name === 'map') {
          const sidebarToggle = await page.evaluate(() => {
            const toggles = document.querySelectorAll('button');
            for (const btn of toggles) {
              if (btn.textContent.toLowerCase().includes('menu') ||
                  btn.querySelector('svg') &&
                  btn.getBoundingClientRect().width < 60) {
                return { exists: true, width: btn.getBoundingClientRect().width, height: btn.getBoundingClientRect().height };
              }
            }
            return { exists: false };
          });
          if (sidebarToggle.exists) {
            if (sidebarToggle.width < 44 || sidebarToggle.height < 44) {
              pageIssues.push(`Sidebar toggle too small: ${sidebarToggle.width}x${sidebarToggle.height}px`);
            }
          }
        }

        // ── 7. Console errors ──
        if (consoleErrors.length > 0) {
          const recentErrors = consoleErrors.slice(-5);
          for (const e of recentErrors) {
            if (!e.message.includes('401') && !e.message.includes('403') && !e.message.includes('ERR_BLOCKED_BY_CLIENT')) {
              pageIssues.push(`Console error: ${e.type} - ${e.message.slice(0, 100)}`);
            }
          }
        }

        // ── 8. Hydration warnings in HTML ──
        const html = await page.content();
        if (html.includes('hydrat') || html.includes('Hydration')) {
          hydrationErrors.push(`Possible hydration warning on ${p.name} @ ${vp.name}`);
        }

      } catch (err) {
        pageIssues.push(`Page load error: ${err.message}`);
      }

      const status = pageIssues.length === 0 ? 'PASS' : 'FAIL';
      allResults.push({ viewport: vp.name, page: p.name, status, issues: pageIssues });

      if (pageIssues.length > 0) {
        console.log(`  ❌ ${p.name}: ${pageIssues.join(' | ')}`);
      } else {
        console.log(`  ✅ ${p.name}`);
      }
    }

    // Collect errors across viewport loops for summary
    allConsoleErrors.push(...consoleErrors);
    allHydrationErrors.push(...hydrationErrors);

    await context.close();
  }

  await browser.close();

  // Summary
  console.log('\n========== MOBILE VERIFICATION SUMMARY ==========');
  let pass = 0, fail = 0;
  for (const r of allResults) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${r.viewport}] ${r.page}: ${r.status}${r.issues.length ? ' - ' + r.issues.join('; ') : ''}`);
    if (r.status === 'PASS') pass++; else fail++;
  }
  console.log(`\nPassed: ${pass}, Failed: ${fail}, Total: ${allResults.length}`);
  if (allConsoleErrors.length > 0) {
    console.log(`\nConsole errors seen (first 10):`);
    allConsoleErrors.slice(0, 10).forEach(e => console.log(`  ${e.type}: ${e.message.slice(0, 120)}`));
  }
  if (allHydrationErrors.length > 0) {
    console.log(`\nHydration warnings detected: ${allHydrationErrors.length}`);
    allHydrationErrors.forEach(e => console.log(`  ${e}`));
  }

  // Write full report
  const report = {
    timestamp: new Date().toISOString(),
    summary: { passed: pass, failed: fail, total: allResults.length },
    results: allResults,
    consoleErrors: allConsoleErrors.slice(0, 50),
    hydrationErrors: allHydrationErrors,
  };
  writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 2));
  console.log(`\nFull report: ${outDir}/report.json`);

  process.exit(fail > 0 ? 1 : 0);
}

run();
