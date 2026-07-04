import { chromium } from 'playwright';

const VIEWPORTS = [
  { width: 320, height: 568, name: '320' },
  { width: 360, height: 800, name: '360' },
  { width: 375, height: 812, name: '375' },
  { width: 390, height: 844, name: '390' },
  { width: 412, height: 915, name: '412' },
];

async function getElementBox(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { error: `${sel} not found` };
    const rect = el.getBoundingClientRect();
    const cs = window.getComputedStyle(el);
    const parent = el.parentElement;
    const parentRect = parent ? parent.getBoundingClientRect() : null;
    return {
      tag: el.tagName,
      classes: el.className,
      width: rect.width,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      computed: {
        display: cs.display,
        maxWidth: cs.maxWidth,
        minWidth: cs.minWidth,
        width: cs.width,
        overflow: cs.overflow,
        overflowX: cs.overflowX,
        overflowY: cs.overflowY,
        position: cs.position,
        flex: cs.flex,
        flexWrap: cs.flexWrap,
        flexDirection: cs.flexDirection,
        grid: cs.grid,
        wordBreak: cs.wordBreak,
        overflowWrap: cs.overflowWrap,
        whiteSpace: cs.whiteSpace,
      },
      parent: parent ? {
        tag: parent.tagName,
        classes: parent.className,
        width: parentRect?.width,
        left: parentRect?.left,
        right: parentRect?.right,
      } : null,
      exceedsViewport: rect.right > window.innerWidth + 1,
      exceedsParent: parentRect ? rect.right > parentRect.right + 1 : false,
    };
  }, selector);
}

async function traceOverflowChain(page) {
  const chain = [
    'main#main-content',
    '.tei-main',
    '.min-h-screen',
    '.glass-card',
    'h1',
    'h1 span',
    '.kpi-grid',
    '.kpi-card',
  ];
  console.log('\n=== OVERFLOW TRACE ===');
  console.log(`Viewport: ${page.viewportSize().width}x${page.viewportSize().height}`);
  for (const sel of chain) {
    const info = await getElementBox(page, sel);
    console.log(`\n[${sel}]`, JSON.stringify(info, null, 2));
  }
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n\n=== VIEWPORT ${vp.name} (${vp.width}x${vp.height}) ===`);
    const context = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
    const page = await context.newPage();

    try {
      await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(2000);

      // Full page screenshot
      await page.screenshot({
        path: `screenshot-${vp.name}.png`,
        fullPage: true,
      });

      // Trace overflow
      await traceOverflowChain(page);

      // Additional overflow diagnostics
      const overflowInfo = await page.evaluate(() => {
        const results = [];
        const allEls = document.querySelectorAll('*');
        let maxRight = 0;
        let maxEl = null;
        for (const el of allEls) {
          const rect = el.getBoundingClientRect();
          if (rect.right > maxRight) {
            maxRight = rect.right;
            maxEl = el;
          }
          if (rect.right > window.innerWidth + 2) {
            results.push({
              tag: el.tagName,
              id: el.id,
              classes: el.className.slice(0, 100),
              rect: { left: rect.left, right: rect.right, width: rect.width },
              exceedsBy: rect.right - window.innerWidth,
            });
            if (results.length > 20) break;
          }
        }
        return { overflowing: results, maxRight, maxRightEl: maxEl ? { tag: maxEl.tagName, classes: maxEl.className.slice(0, 100), right: maxRight } : null };
      });

      console.log('\n=== OVERFLOWING ELEMENTS ===');
      if (overflowInfo.overflowing.length === 0) {
        console.log('No elements overflow viewport!');
      } else {
        console.log(JSON.stringify(overflowInfo, null, 2));
      }
    } catch (err) {
      console.error(`Error at ${vp.name}:`, err.message);
    }

    await context.close();
  }

  await browser.close();
  console.log('\n=== DONE ===');
}

run().catch(console.error);
