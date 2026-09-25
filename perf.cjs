// Phone-class performance profiler. Measures real frame-to-frame timing
// (via requestAnimationFrame) under simulated CPU throttling, for the
// scenarios called out in the project spec's performance requirement.
//
// Usage:
//   npm run build && npm run preview -- --port 4390   # in one terminal
//   npm install --no-save playwright-core             # one-off, not a project dependency
//   npx playwright install chromium                    # skip if you already have a Chromium Playwright can find
//   THROTTLE=8 node perf.cjs                            # THROTTLE defaults to 4 (DevTools "Low-end mobile")
//
// Set PLAYWRIGHT_CHROMIUM_PATH to point at an existing Chromium binary
// instead of installing one.
const { chromium } = require('playwright-core');
const URL = process.env.PERF_URL || 'http://localhost:4390/';

const CPU_THROTTLE = Number(process.env.THROTTLE || 4);

async function measureFrames(page, ms) {
  return page.evaluate((duration) => {
    return new Promise((resolve) => {
      const frames = [];
      let last = performance.now();
      let raf;
      const tick = (now) => {
        frames.push(now - last);
        last = now;
        if (now - start < duration) {
          raf = requestAnimationFrame(tick);
        } else {
          cancelAnimationFrame(raf);
          resolve(frames);
        }
      };
      const start = performance.now();
      raf = requestAnimationFrame(tick);
    });
  }, ms);
}

function summarize(label, frames) {
  const drop = frames.slice(1); // drop the first sample (includes eval overhead)
  const fps = drop.map((ms) => 1000 / ms);
  const avgFrameMs = drop.reduce((a, b) => a + b, 0) / drop.length;
  const avgFps = 1000 / avgFrameMs;
  const sorted = [...drop].sort((a, b) => a - b);
  const p95FrameMs = sorted[Math.floor(sorted.length * 0.95)];
  const worstFrameMs = sorted[sorted.length - 1];
  const droppedBelow30 = fps.filter((f) => f < 30).length;
  const droppedBelow50 = fps.filter((f) => f < 50).length;
  console.log(
    `${label}: ${drop.length} frames | avg ${avgFps.toFixed(1)}fps (${avgFrameMs.toFixed(2)}ms) | ` +
      `p95 frame ${p95FrameMs.toFixed(2)}ms | worst frame ${worstFrameMs.toFixed(2)}ms | ` +
      `frames <30fps: ${droppedBelow30} (${((droppedBelow30 / drop.length) * 100).toFixed(1)}%) | <50fps: ${droppedBelow50}`,
  );
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // --- 1. Idle baseline (static stage, 106 people rendered, no interaction) ---
  summarize(`Idle (static stage, phone, ${CPU_THROTTLE}x CPU throttle)`, await measureFrames(page, 1500));

  // --- 2. Pan (continuous pointer-move drag across the stage) ---
  const svg = page.locator('svg').first();
  const box = await svg.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  const panPromise = measureFrames(page, 1200);
  for (let i = 0; i < 20; i++) {
    await page.mouse.move(box.x + box.width / 2 + i * 4, box.y + box.height / 2 + (i % 2) * 3, { steps: 1 });
  }
  summarize(`Pan (single-finger drag, phone, ${CPU_THROTTLE}x CPU throttle)`, await panPromise);
  await page.mouse.up();

  // --- 3. Pinch-zoom (simulated via wheel, same code path as pinch scaling) ---
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const zoomPromise = measureFrames(page, 1200);
  for (let i = 0; i < 15; i++) {
    await page.mouse.wheel(0, -40);
  }
  summarize(`Zoom (wheel/pinch-equivalent, phone, ${CPU_THROTTLE}x CPU throttle)`, await zoomPromise);

  // Reset zoom/pan back to fit before measuring playback
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // --- 4. Full transition playback: 106 people + 3 props + 2 mics animating ---
  const playPromise = measureFrames(page, 1600);
  await page.getByLabel('Play').click();
  summarize(`Transition playback (106 people + props + mics, phone, ${CPU_THROTTLE}x CPU throttle)`, await playPromise);

  // --- 5. Editor drag with 106 static + 1 moving (worst-case interactive path) ---
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Editor Login' }).click();
  await page.getByPlaceholder('demo: director').fill('director');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForTimeout(500);
  const icon = page.locator('[data-member-id="m-40"] > circle').first();
  const ibox = await icon.boundingBox();
  await page.mouse.move(ibox.x + ibox.width / 2, ibox.y + ibox.height / 2);
  await page.mouse.down();
  const dragPromise = measureFrames(page, 1200);
  for (let i = 0; i < 20; i++) {
    await page.mouse.move(ibox.x + ibox.width / 2 + i * 3, ibox.y + ibox.height / 2 + i * 2, { steps: 1 });
  }
  summarize(`Editor drag (one person, 106 on stage, phone, ${CPU_THROTTLE}x CPU throttle)`, await dragPromise);
  await page.mouse.up();

  await browser.close();
})();
