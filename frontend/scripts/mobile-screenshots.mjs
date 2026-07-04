import { chromium } from 'playwright';

const VIEWPORTS = [
  { width: 320, height: 568, name: '320x568' },
  { width: 360, height: 800, name: '360x800' },
  { width: 375, height: 812, name: '375x812' },
  { width: 390, height: 844, name: '390x844' },
  { width: 412, height: 915, name: '412x915' },
  { width: 768, height: 1024, name: '768x1024' },
];

const PAGES = [
  { path: '/', name: 'dashboard' },
  { path: '/map', name: 'map' },
  { path: '/forecast', name: 'forecast' },
  { path: '/stress', name: 'stress' },
  { path: '/assistant', name: 'assistant' },
  { path: '/simulator', name: 'simulator' },
  { path: '/reports', name: 'reports' },
  { path: '/api-access', name: 'api-access' },
  { path: '/settings', name: 'settings' },
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n=== Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    const context = await browser.newContext({
      viewport: vp,
      deviceScaleFactor: 2,
      isMobile: vp.width < 768,
      hasTouch: vp.width < 768,
    });
    const page = await context.newPage();

    for (const p of PAGES) {
      try {
        await page.goto(`http://localhost:3000${p.path}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1000);

        const issues = [];

        // Check for overflowing elements
        const overflow = await page.evaluate(() => {
          const all = document.querySelectorAll('*');
          const issues = [];
          const docW = document.documentElement.clientWidth;
          const docH = document.documentElement.clientHeight;
          for (const el of all) {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            if (rect.right > docW + 5) {
              const tag = el.tagName;
              const cls = el.className?.toString?.()?.slice(0, 100);
              const text = (el.textContent || '').trim().slice(0, 50);
              if (!cls?.includes('cursor') && !cls?.includes('fixed')) {
                issues.push({ tag, classes: cls, text, right: Math.round(rect.right), width: Math.round(rect.width) });
              }
            }
            if (rect.bottom > docH + 5 && rect.top < docH) {
              // Content extends below viewport - only flag if it's the last visible element
            }
          }
          return issues.slice(0, 5);
        });

        if (overflow.length > 0) {
          issues.push(`Overflow: ${overflow.map(o => `${o.tag} (w:${o.width}, right:${o.right})${o.text ? ' "'+o.text+'"' : ''}`).join(', ')}`);
        }

        // Check if main content area has wrong width
        const mainWidth = await page.evaluate(() => {
          const main = document.querySelector('.tei-main');
          return main ? `${main.clientWidth}px` : 'N/A';
        });

        // Check for clipped cards (cards near bottom getting cut)
        const clippedCards = await page.evaluate(() => {
          const cards = document.querySelectorAll('.glass-card');
          const docH = document.documentElement.clientHeight;
          const clipped = [];
          for (const card of cards) {
            const rect = card.getBoundingClientRect();
            if (rect.bottom > docH && rect.top < docH) {
              clipped.push(card.textContent?.trim()?.slice(0, 40));
            }
          }
          return clipped;
        });

        if (clippedCards.length > 0) {
          issues.push(`Clipped cards at bottom edge: ${clippedCards.join(', ')}`);
        }

        // Check for page title rendering
        const titleSize = await page.evaluate(() => {
          const h1 = document.querySelector('.page-title, h1');
          if (!h1) return null;
          const rect = h1.getBoundingClientRect();
          return { width: Math.round(rect.width), text: (h1.textContent || '').trim().slice(0, 60) };
        });

        const status = issues.length === 0 ? 'PASS' : 'ISSUES';
        results.push({ viewport: vp.name, page: p.name, status, issues, mainWidth, titleSize });

        if (issues.length > 0) {
          console.log(`  ${p.name}: ${status}`);
          issues.forEach(i => console.log(`    - ${i}`));
        } else {
          console.log(`  ${p.name}: ${status} (main: ${mainWidth})`);
        }

      } catch (err) {
        console.log(`  ${p.name}: ERROR - ${err.message}`);
        results.push({ viewport: vp.name, page: p.name, status: 'ERROR', issues: [err.message] });
      }
    }
    await context.close();
  }

  await browser.close();

  console.log('\n========== SUMMARY ==========');
  let pass = 0, fail = 0;
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${r.viewport}] ${r.page}: ${r.status}${r.issues.length ? ' ('+r.issues.join('; ')+')' : ''}`);
    if (r.status === 'PASS') pass++; else fail++;
  }
  console.log(`\nPassed: ${pass}, Failed: ${fail}, Total: ${results.length}`);
  process.exit(fail > 0 ? 1 : 0);
}

run();
