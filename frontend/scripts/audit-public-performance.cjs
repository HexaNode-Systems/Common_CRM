/* Reproducible production-only lab audit. Uses the existing backend Puppeteer;
   no application dependencies, live backend calls, or form delivery required. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const puppeteer = require(path.join(root, 'backend/node_modules/puppeteer'));
const label = process.argv[2] || 'baseline';
assert(/^[a-z-]+$/.test(label), 'Use a simple audit label.');
const runCount = Number(process.env.APPNIX_AUDIT_RUNS || 3);
const origin = process.env.APPNIX_AUDIT_ORIGIN || 'http://127.0.0.1:4173';
const output = path.join(root, 'docs/performance');
const screenshots = path.join(process.env.TEMP || '/tmp', 'appnix-performance', label);
const routes = ['/lead-management', '/contact', '/whatsapp-crm', '/pricing'];
const profiles = {
  desktop: { width: 1440, height: 1000, deviceScaleFactor: 1, cpuRate: 1, latency: 40, download: 10_000_000 / 8, upload: 5_000_000 / 8 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 1, cpuRate: 4, latency: 150, download: 1_600_000 / 8, upload: 750_000 / 8 },
};
const settings = { theme: { primaryColor: '#2563eb', secondaryColor: '#0f172a', accentColor: '#f59e0b', fontFamily: 'Inter, system-ui, sans-serif', borderRadius: '8px', splashEnabled: false } };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const round = number => Math.round(number * 100) / 100;
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

async function prepare(browser, profile) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: profile.width, height: profile.height, deviceScaleFactor: profile.deviceScaleFactor, isMobile: profile.width < 600, hasTouch: profile.width < 600 });
  const client = await page.createCDPSession();
  await client.send('Network.enable');
  await client.send('Network.setCacheDisabled', { cacheDisabled: true });
  await client.send('Network.setBypassServiceWorker', { bypass: true });
  await client.send('Network.emulateNetworkConditions', { offline: false, latency: profile.latency, downloadThroughput: profile.download, uploadThroughput: profile.upload });
  await client.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuRate });
  await page.setRequestInterception(true);
  page.on('request', async request => {
    if (request.url().startsWith(origin + '/')) return request.continue();
    if (request.method() !== 'GET' && request.method() !== 'OPTIONS') return request.abort();
    await sleep(100);
    return request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: JSON.stringify(settings) });
  });
  await page.evaluateOnNewDocument(() => {
    window.__lab = { lcp: 0, lcpElement: '', shifts: [], tasks: [], heroReady: 0 };
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) { window.__lab.lcp = entry.startTime; window.__lab.lcpElement = entry.element?.tagName + '.' + entry.element?.className; }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__lab.shifts.push({ time: entry.startTime, value: entry.value });
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) window.__lab.tasks.push({ start: entry.startTime, duration: entry.duration });
    }).observe({ type: 'longtask', buffered: true });
    const observer = new MutationObserver(() => {
      if (!document.querySelector('.crm-marketing h1') || window.__lab.heroReady) return;
      requestAnimationFrame(() => { window.__lab.heroReady ||= performance.now(); });
      observer.disconnect();
    });
    observer.observe(document, { childList: true, subtree: true });
  });
  return { context, page, client };
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  fs.mkdirSync(screenshots, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: process.env.APPNIX_AUDIT_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] });
  const report = { label, measuredAt: new Date().toISOString(), browser: await browser.version(), origin, runsPerPageAndProfile: runCount, profiles, methodology: 'Cold browser context and disabled cache for every navigation; CDP applied network and CPU throttling; one page at a time; 1.5 seconds of observation after fonts settle. External GET requests receive a fixed settings response after 100 ms; POSTs are blocked. Local production preview, not a deployed-host or Lighthouse score. Bytes are encoded resource response bodies, without HTTP headers. Observed blocking time sums long-task time over 50 ms after FCP until the end of the load observation window; not Lighthouse simulated TBT. Modal timing measures click-to-visible dialog plus two animation frames.', results: [], coverage: [] };
  try {
    for (const [device, profile] of Object.entries(profiles)) {
      for (const route of routes) {
        const runs = [];
        for (let run = 1; run <= runCount; run++) {
          const { context, page } = await prepare(browser, profile);
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          try {
            await page.goto(origin + route, { waitUntil: 'load', timeout: 60000 });
            await page.waitForSelector('.crm-marketing h1', { timeout: 45000 });
            const fontsReadyMs = await page.evaluate(async () => { await document.fonts.ready; return performance.now(); });
            await sleep(1500);
            const metrics = await page.evaluate(() => {
              const paints = performance.getEntriesByType('paint');
              const fcp = paints.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
              const navigation = performance.getEntriesByType('navigation')[0];
              let cls = 0, session = 0, sessionStart = 0, previous = 0;
              for (const shift of window.__lab.shifts) {
                if (shift.time - previous > 1000 || shift.time - sessionStart > 5000) { session = 0; sessionStart = shift.time; }
                session += shift.value; previous = shift.time; cls = Math.max(cls, session);
              }
              const resources = performance.getEntriesByType('resource').filter(entry => entry.name.startsWith(location.origin));
              return { fcpMs: fcp, lcpMs: window.__lab.lcp, cls, heroReadyMs: window.__lab.heroReady, domContentLoadedMs: navigation.domContentLoadedEventEnd, observedBlockingMs: window.__lab.tasks.filter(task => task.start >= fcp).reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0), resources: resources.map(entry => ({ path: new URL(entry.name).pathname, type: entry.initiatorType, encodedBytes: entry.encodedBodySize, decodedBytes: entry.decodedBodySize, startMs: entry.startTime, durationMs: entry.duration })), lcpElement: window.__lab.lcpElement };
            });
            const jsBytes = metrics.resources.filter(resource => resource.path.endsWith('.js')).reduce((sum, resource) => sum + resource.encodedBytes, 0);
            const cssBytes = metrics.resources.filter(resource => resource.path.endsWith('.css')).reduce((sum, resource) => sum + resource.encodedBytes, 0);
            const fontBytes = metrics.resources.filter(resource => resource.path.endsWith('.woff2')).reduce((sum, resource) => sum + resource.encodedBytes, 0);
            if (run === 1) await page.screenshot({ path: path.join(screenshots, `${device}-${route.slice(1)}.png`), fullPage: true });
            const modalMs = await page.evaluate(async () => {
              const start = performance.now();
              document.querySelector('.mp-nav-actions button').click();
              while (!document.querySelector('[role=dialog]')) await new Promise(resolve => requestAnimationFrame(resolve));
              await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
              return performance.now() - start;
            });
            runs.push({ run, ...metrics, fontsReadyMs, modalMs, jsBytes, cssBytes, fontBytes, resourceBodyBytes: metrics.resources.reduce((sum, resource) => sum + resource.encodedBytes, 0), errors });
          } finally { await context.close(); }
        }
        const medians = {};
        for (const metric of ['fcpMs', 'lcpMs', 'cls', 'heroReadyMs', 'fontsReadyMs', 'observedBlockingMs', 'modalMs', 'jsBytes', 'cssBytes', 'fontBytes', 'resourceBodyBytes']) medians[metric] = round(median(runs.map(run => run[metric])));
        report.results.push({ route, device, medians, runs });
        fs.writeFileSync(path.join(output, `phase-2-${label}.json`), JSON.stringify(report, null, 2));
        console.log(JSON.stringify({ label, route, device, medians }));
      }
    }
    // Coverage is a separate diagnostic navigation, excluded from timing samples.
    const { context, page } = await prepare(browser, profiles.desktop);
    try {
      await page.coverage.startJSCoverage();
      await page.goto(origin + routes[0], { waitUntil: 'networkidle0' });
      await page.waitForSelector('.crm-marketing h1');
      for (const entry of await page.coverage.stopJSCoverage()) {
        if (!entry.url.startsWith(origin + '/assets/')) continue;
        report.coverage.push({ path: new URL(entry.url).pathname, sourceCharacters: entry.text.length, executedCharacters: entry.ranges.reduce((sum, range) => sum + range.end - range.start, 0) });
      }
    } finally { await context.close(); }
    fs.writeFileSync(path.join(output, `phase-2-${label}.json`), JSON.stringify(report, null, 2));
    const observedErrors = [...new Set(report.results.flatMap(result => result.runs.flatMap(run => run.errors)))];
    // Existing renderToString/lazy-boundary recovery is recorded in the baseline.
    // It is outside this performance phase; do not hide it or treat it as new.
    report.browserErrors = observedErrors;
    fs.writeFileSync(path.join(output, `phase-2-${label}.json`), JSON.stringify(report, null, 2));
    assert(observedErrors.every(error => error.includes('Minified React error #419')), 'Unexpected browser runtime errors were recorded.');
    console.log(`Saved docs/performance/phase-2-${label}.json; screenshots: ${screenshots}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
