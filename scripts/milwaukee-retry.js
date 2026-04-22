/**
 * Milwaukee Image Retry Script
 *
 * Retries failed downloads using multiple fallback strategies:
 *
 * For "No image on page" errors (628):
 *   1. Search JSON-LD for any ImageObject.contentUrl
 *   2. og:image / twitter:image meta tags
 *   3. All <img> tags with /--/web-images/ URLs
 *   4. preload links for images
 *
 * For HTTP 404 errors (1520):
 *   1. Milwaukee search API: /api/search?q={partNumber}
 *   2. Scan sitemap.xml for part number
 *   3. Try alternate URL patterns
 *
 * Usage:
 *   node scripts/milwaukee-retry.js               # Retry all errors
 *   node scripts/milwaukee-retry.js --no-image    # Only retry "No image" errors
 *   node scripts/milwaukee-retry.js --404         # Only retry 404 errors
 *   node scripts/milwaukee-retry.js --test        # Test first 10
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const IMAGE_DIR = '/var/www/static-uploads/milwaukee';
const ERROR_FILE = '/tmp/milwaukee-errors.json';
const RETRY_STATUS_FILE = '/tmp/milwaukee-retry-status.json';
const RETRY_ERROR_FILE = '/tmp/milwaukee-retry-errors.json';
const PID_FILE = '/tmp/milwaukee-retry.pid';
const BASE_URL = 'https://www.milwaukeetool.com';

const CONCURRENT = 2;
const DELAY_BETWEEN_BATCH = 2000;
const TIMEOUT = 30000;
const MAX_RETRIES = 2;

const args = process.argv.slice(2);
const isTest = args.includes('--test');
const onlyNoImage = args.includes('--no-image');
const only404 = args.includes('--404');

// ============ HELPERS ============

function httpGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: options.timeout || TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept: options.accept || 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        ...options.headers,
      },
    };

    const req = protocol.request(reqOptions, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsedUrl.protocol}//${parsedUrl.host}${res.headers.location}`;
        httpGet(redirectUrl, options).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
        });
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
    req.end();
  });
}

async function downloadImage(url, destPath) {
  const res = await httpGet(url, { accept: 'image/*,*/*' });
  if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
  if (res.body.length < 1000) throw new Error(`Image too small (${res.body.length} bytes)`);
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(destPath, res.body);
  return res.body.length;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function normalizeUrl(url) {
  if (!url) return null;
  if (url.startsWith('//')) return 'https:' + url;
  if (url.startsWith('/')) return BASE_URL + url;
  if (url.startsWith('http')) return url;
  return null;
}

/**
 * Strategy 1: Try multiple ways to extract image from product page HTML
 */
function extractImageStrategies(html) {
  const htmlStr = html.toString('utf8');
  const strategies = [];

  // 1. primaryImageOfPage from JSON-LD
  const primary = htmlStr.match(/"primaryImageOfPage"\s*:\s*\{\s*"@id"\s*:\s*"([^"]+)"/);
  if (primary) strategies.push({ name: 'primaryImageOfPage', url: primary[1] });

  // 2. All ImageObject.contentUrl in JSON-LD
  const imgObjs = [...htmlStr.matchAll(/"@type"\s*:\s*"ImageObject"[^}]*"contentUrl"\s*:\s*"([^"]+)"/g)];
  for (const m of imgObjs) {
    strategies.push({ name: 'ImageObject.contentUrl', url: m[1] });
  }

  // 3. og:image
  const og = htmlStr.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/);
  if (og) strategies.push({ name: 'og:image', url: og[1] });

  // 4. twitter:image
  const tw = htmlStr.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/);
  if (tw) strategies.push({ name: 'twitter:image', url: tw[1] });

  // 5. preload links for images
  const preloads = [...htmlStr.matchAll(/<link[^>]+rel=["']preload["'][^>]+as=["']image["'][^>]+href=["']([^"']+)["']/g)];
  for (const m of preloads) {
    strategies.push({ name: 'preload link', url: m[1] });
  }

  // 6. <img> tags with /--/web-images/ (product images)
  const productImgs = [...htmlStr.matchAll(/<img[^>]+src=["']([^"']*\/--\/web-images\/[^"']+)["']/g)];
  for (const m of productImgs) {
    strategies.push({ name: 'product <img>', url: m[1] });
  }

  // Deduplicate & normalize (strip &amp; to &, decode entities)
  const seen = new Set();
  return strategies
    .map((s) => ({ name: s.name, url: s.url.replace(/&amp;/g, '&') }))
    .filter((s) => {
      if (!s.url || seen.has(s.url)) return false;
      seen.add(s.url);
      return true;
    })
    .map((s) => ({ name: s.name, url: normalizeUrl(s.url) }))
    .filter((s) => s.url);
}

/**
 * Strategy for 404: try Milwaukee search API to find product
 */
async function tryMilwaukeeSearch(partNumber) {
  // Try internal Next.js RSC data endpoint
  const urls = [
    `${BASE_URL}/_next/data/search?q=${encodeURIComponent(partNumber)}`,
    `${BASE_URL}/search?q=${encodeURIComponent(partNumber)}`,
    `${BASE_URL}/Search?q=${encodeURIComponent(partNumber)}`,
  ];
  for (const url of urls) {
    try {
      const res = await httpGet(url);
      if (res.statusCode === 200) {
        const html = res.body.toString('utf8');
        // Look for product page URL
        const match = html.match(
          new RegExp(`/products/details/[^"'\\s]+/${partNumber}(?:-\\w+)?`, 'i')
        );
        if (match) return `${BASE_URL}${match[0]}`;
      }
    } catch {}
  }
  return null;
}

/**
 * Try multiple strategies to get image for a part number
 */
async function retryProduct(partNumber, errorType) {
  // First: try direct product page (might work if it was a transient 500 error)
  let productUrl = `${BASE_URL}/products/details/${encodeURIComponent(partNumber)}`;
  let pageRes;
  try {
    pageRes = await httpGet(productUrl);
  } catch (err) {
    return { ok: false, error: `Page fetch: ${err.message}` };
  }

  // If 404, try search API
  if (pageRes.statusCode === 404 || errorType === '404') {
    const searchUrl = await tryMilwaukeeSearch(partNumber);
    if (!searchUrl) {
      return { ok: false, error: 'Not found via search' };
    }
    try {
      pageRes = await httpGet(searchUrl);
      productUrl = searchUrl;
    } catch (err) {
      return { ok: false, error: `Search page fetch: ${err.message}` };
    }
  }

  if (pageRes.statusCode !== 200) {
    return { ok: false, error: `Page HTTP ${pageRes.statusCode}` };
  }

  // Try all image extraction strategies
  const strategies = extractImageStrategies(pageRes.body);

  for (const strat of strategies) {
    const destPath = path.join(IMAGE_DIR, partNumber, `${partNumber}_main.webp`);

    // Skip if already exists
    if (fs.existsSync(destPath)) {
      return { ok: true, strategy: 'already exists' };
    }

    try {
      await downloadImage(strat.url, destPath);
      return { ok: true, strategy: strat.name, url: strat.url };
    } catch {}
  }

  return {
    ok: false,
    error: `All strategies failed (${strategies.length} tried)`,
  };
}

// ============ MAIN ============

async function main() {
  if (!fs.existsSync(ERROR_FILE)) {
    console.log('No error file found:', ERROR_FILE);
    process.exit(1);
  }

  fs.writeFileSync(PID_FILE, process.pid.toString());
  let shouldStop = false;
  process.on('SIGTERM', () => { shouldStop = true; });
  process.on('SIGINT', () => { shouldStop = true; });

  const allErrors = JSON.parse(fs.readFileSync(ERROR_FILE, 'utf8'));

  // Deduplicate by partNumber (keep latest error)
  const byPart = new Map();
  for (const e of allErrors) byPart.set(e.partNumber, e);
  let uniqueErrors = Array.from(byPart.values());

  // Filter by error type
  if (onlyNoImage) {
    uniqueErrors = uniqueErrors.filter((e) => e.error.includes('No image'));
  } else if (only404) {
    uniqueErrors = uniqueErrors.filter((e) => e.error.includes('404'));
  }

  // Remove products that are already downloaded (maybe from earlier runs)
  uniqueErrors = uniqueErrors.filter((e) => {
    const folder = path.join(IMAGE_DIR, e.partNumber);
    if (!fs.existsSync(folder)) return true;
    const files = fs.readdirSync(folder).filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f));
    return files.length === 0;
  });

  if (isTest) {
    uniqueErrors = uniqueErrors.slice(0, 10);
  }

  console.log(`=== Milwaukee Retry ===`);
  console.log(`Total to retry: ${uniqueErrors.length}`);
  console.log(`Concurrent: ${CONCURRENT}\n`);

  let resolved = 0;
  let stillFailed = 0;
  const newErrors = [];
  const strategyStats = {};

  for (let i = 0; i < uniqueErrors.length; i += CONCURRENT) {
    if (shouldStop) {
      console.log('\nStopping...');
      break;
    }

    const batch = uniqueErrors.slice(i, i + CONCURRENT);

    await Promise.all(
      batch.map(async (e) => {
        const errorType = e.error.includes('404')
          ? '404'
          : e.error.includes('No image')
          ? 'no-image'
          : 'other';

        const result = await retryProduct(e.partNumber, errorType);

        if (result.ok) {
          resolved++;
          strategyStats[result.strategy] = (strategyStats[result.strategy] || 0) + 1;
          if (isTest || resolved % 50 === 0) {
            console.log(`  ✓ ${e.partNumber} via ${result.strategy}`);
          }
        } else {
          stillFailed++;
          newErrors.push({
            partNumber: e.partNumber,
            originalError: e.error,
            retryError: result.error,
            time: new Date().toISOString(),
          });
          if (isTest) {
            console.log(`  ✗ ${e.partNumber}: ${result.error}`);
          }
        }
      })
    );

    fs.writeFileSync(
      RETRY_STATUS_FILE,
      JSON.stringify(
        {
          total: uniqueErrors.length,
          processed: Math.min(i + CONCURRENT, uniqueErrors.length),
          resolved,
          stillFailed,
          strategies: strategyStats,
          running: !shouldStop,
        },
        null,
        2
      )
    );

    if (i % 50 === 0 || isTest) {
      const processed = Math.min(i + CONCURRENT, uniqueErrors.length);
      console.log(
        `Progress: ${processed}/${uniqueErrors.length} | Resolved: ${resolved} | Still failed: ${stillFailed}`
      );
    }

    await sleep(DELAY_BETWEEN_BATCH);
  }

  // Save final errors
  fs.writeFileSync(RETRY_ERROR_FILE, JSON.stringify(newErrors, null, 2));

  console.log('\n=== Complete ===');
  console.log(`Resolved:     ${resolved}`);
  console.log(`Still failed: ${stillFailed}`);
  console.log('\nStrategy breakdown:');
  for (const [k, v] of Object.entries(strategyStats)) {
    console.log(`  ${k}: ${v}`);
  }
  console.log(`\nRemaining errors saved to: ${RETRY_ERROR_FILE}`);

  if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
}

main().catch((e) => {
  console.error(e);
  if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  process.exit(1);
});
