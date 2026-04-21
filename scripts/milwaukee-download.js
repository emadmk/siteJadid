/**
 * Milwaukee Tool Image Downloader
 *
 * Downloads product images from milwaukeetool.com for Milwaukee products.
 * Reads Excel file, extracts Supplier Part Numbers (Column L), fetches product
 * pages, extracts image URL from JSON-LD schema.org data, and downloads.
 *
 * Flow for each part number:
 *   1. Fetch https://www.milwaukeetool.com/products/details/{partNumber}
 *      (follows 308 redirect to full slug URL)
 *   2. Parse HTML for <script type="application/ld+json"> primaryImageOfPage URL
 *   3. Download image (WebP format from Milwaukee)
 *   4. Save to /var/www/static-uploads/milwaukee/{partNumber}/{partNumber}_main.webp
 *
 * Usage:
 *   Start:    node scripts/milwaukee-download.js start
 *   Resume:   node scripts/milwaukee-download.js resume
 *   Status:   node scripts/milwaukee-download.js status
 *   Stop:     node scripts/milwaukee-download.js stop
 *   Errors:   node scripts/milwaukee-download.js errors
 *   Test:     node scripts/milwaukee-download.js test  (first 5 products)
 *
 * Background:
 *   nohup node scripts/milwaukee-download.js start > /tmp/milwaukee-download.log 2>&1 &
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// ============ CONFIG ============
const IMAGE_DIR = process.env.IMAGE_DIR || '/var/www/static-uploads/milwaukee';
const STATUS_FILE = '/tmp/milwaukee-status.json';
const ERROR_FILE = '/tmp/milwaukee-errors.json';
const PID_FILE = '/tmp/milwaukee-download.pid';
const BASE_URL = 'https://www.milwaukeetool.com';

const CONCURRENT = parseInt(process.env.CONCURRENT) || 3;
const DELAY_BETWEEN_BATCH = 1500;
const DELAY_ON_ERROR = 8000;
const MAX_RETRIES = 3;
const TIMEOUT = 30000;
// ================================

const command = process.argv[2] || 'status';

// ---- STATUS ----
if (command === 'status') {
  if (!fs.existsSync(STATUS_FILE)) {
    console.log('No download in progress. Run: node scripts/milwaukee-download.js start');
    process.exit(0);
  }
  const status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  const elapsed = status.running ? Math.round((Date.now() - status.startedAt) / 1000 / 60) : 0;
  console.log('=== Milwaukee Image Download Status ===');
  console.log(`State:       ${status.running ? 'RUNNING' : 'STOPPED'}`);
  console.log(`Products:    ${status.processed}/${status.total} (${((status.processed / Math.max(status.total, 1)) * 100).toFixed(1)}%)`);
  console.log(`Downloaded:  ${status.downloaded}`);
  console.log(`Skipped:     ${status.skipped}`);
  console.log(`Errors:      ${status.errors}`);
  console.log(`Rate:        ~${elapsed > 0 ? Math.round(status.downloaded / elapsed) : 0} imgs/min`);
  console.log(`Elapsed:     ${elapsed} minutes`);
  if (status.currentProduct) console.log(`Current:     ${status.currentProduct}`);
  if (status.lastError) console.log(`Last Error:  ${status.lastError}`);
  process.exit(0);
}

// ---- ERRORS ----
if (command === 'errors') {
  if (!fs.existsSync(ERROR_FILE)) {
    console.log('No errors logged.');
    process.exit(0);
  }
  const errors = JSON.parse(fs.readFileSync(ERROR_FILE, 'utf8'));
  console.log(`=== ${errors.length} Errors ===\n`);
  errors.slice(-50).forEach(e => {
    console.log(`${e.partNumber} | ${e.error}`);
  });
  if (errors.length > 50) console.log(`\n... showing last 50 of ${errors.length}`);
  process.exit(0);
}

// ---- STOP ----
if (command === 'stop') {
  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
    try {
      process.kill(parseInt(pid), 'SIGTERM');
      console.log(`Sent stop signal to PID ${pid}`);
    } catch {
      console.log('Process not running. Cleaning up...');
    }
    fs.unlinkSync(PID_FILE);
  }
  if (fs.existsSync(STATUS_FILE)) {
    const status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    status.running = false;
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
  }
  console.log('Stopped.');
  process.exit(0);
}

// ---- START / RESUME / TEST ----
if (!['start', 'resume', 'test'].includes(command)) {
  console.log('Usage: node scripts/milwaukee-download.js [start|resume|status|stop|errors|test]');
  process.exit(1);
}

const isResume = command === 'resume';
const isTest = command === 'test';

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
      // Follow redirects
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsedUrl.protocol}//${parsedUrl.host}${res.headers.location}`;
        httpGet(redirectUrl, options).then(resolve).catch(reject);
        return;
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.on('error', reject);
    req.end();
  });
}

function downloadImage(url, destPath) {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await httpGet(url, { accept: 'image/*,*/*', timeout: TIMEOUT });
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      if (res.body.length < 1000) {
        reject(new Error(`Image too small (${res.body.length} bytes)`));
        return;
      }
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(destPath, res.body);
      resolve(res.body.length);
    } catch (err) {
      reject(err);
    }
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function updateStatus(updates) {
  let status = {};
  if (fs.existsSync(STATUS_FILE)) {
    try {
      status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    } catch {}
  }
  Object.assign(status, updates);
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
}

function logError(partNumber, error) {
  let errors = [];
  if (fs.existsSync(ERROR_FILE)) {
    try {
      errors = JSON.parse(fs.readFileSync(ERROR_FILE, 'utf8'));
    } catch {}
  }
  errors.push({
    partNumber,
    error: error.toString(),
    time: new Date().toISOString(),
  });
  fs.writeFileSync(ERROR_FILE, JSON.stringify(errors, null, 2));
}

/**
 * Extract primary image URL from Milwaukee product page HTML (JSON-LD schema)
 */
function extractImageUrl(html) {
  const htmlStr = html.toString('utf8');
  // Look for "primaryImageOfPage":{"@id":"..."}
  const match = htmlStr.match(/"primaryImageOfPage"\s*:\s*\{\s*"@id"\s*:\s*"([^"]+)"/);
  if (match) return match[1];

  // Fallback: look for ImageObject with contentUrl
  const fallback = htmlStr.match(/"@type"\s*:\s*"ImageObject"[^}]*"contentUrl"\s*:\s*"([^"]+)"/);
  if (fallback) return fallback[1];

  // Fallback 2: og:image
  const og = htmlStr.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/);
  if (og) return og[1];

  return null;
}

/**
 * Fetch product page and extract main image URL
 */
async function getProductImageUrl(partNumber) {
  const productUrl = `${BASE_URL}/products/details/${encodeURIComponent(partNumber)}`;
  const res = await httpGet(productUrl, { timeout: TIMEOUT });

  if (res.statusCode !== 200) {
    throw new Error(`Product page HTTP ${res.statusCode}`);
  }

  const imgUrl = extractImageUrl(res.body);
  if (!imgUrl) {
    throw new Error('No image URL found on product page');
  }

  return imgUrl;
}

/**
 * Read Supplier Part Numbers from Excel (Column L)
 */
function readExcelParts() {
  const excelFile = process.env.EXCEL_FILE || findMilwaukeeExcel();
  if (!excelFile) {
    throw new Error(
      'No Excel file found. Set EXCEL_FILE env var or place "GS Import - Milwaukee*.xlsx" in project root.'
    );
  }

  console.log(`Reading: ${excelFile}`);
  const XLSX = require('xlsx');
  const wb = XLSX.readFile(excelFile);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const parts = [];
  const seen = new Set();

  for (const row of rows) {
    const spn = String(row['Supplier Part Number'] || '').replace(/﻿/g, '').trim();
    if (!spn) continue;
    if (seen.has(spn)) continue;
    seen.add(spn);
    parts.push({
      partNumber: spn,
      productCode: String(row['Product Code'] || '').trim(),
      name: String(row['Product Short Description'] || '').trim(),
    });
  }

  console.log(`Found ${parts.length} unique part numbers`);
  return parts;
}

function findMilwaukeeExcel() {
  const cwd = process.cwd();
  const files = fs.readdirSync(cwd).filter((f) =>
    /^GS\s*Import.*Milwaukee.*\.(xlsx|xls)$/i.test(f)
  );
  return files.length > 0 ? path.join(cwd, files[0]) : null;
}

// ============ MAIN ============

async function main() {
  fs.writeFileSync(PID_FILE, process.pid.toString());

  let shouldStop = false;
  process.on('SIGTERM', () => { shouldStop = true; });
  process.on('SIGINT', () => { shouldStop = true; });

  console.log('=== Milwaukee Image Downloader ===');
  console.log(`Mode: ${isTest ? 'TEST (first 5)' : isResume ? 'RESUME' : 'START'}`);
  console.log(`Output: ${IMAGE_DIR}`);
  console.log(`Concurrent: ${CONCURRENT}\n`);

  try {
    let parts = readExcelParts();
    if (isTest) {
      parts = parts.slice(0, 5);
      console.log(`Test mode: ${parts.length} products\n`);
    }

    if (!fs.existsSync(IMAGE_DIR)) {
      fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }

    // For resume: collect already-downloaded folders
    const existing = new Set();
    if (isResume) {
      try {
        const dirs = fs.readdirSync(IMAGE_DIR);
        for (const d of dirs) {
          const dirPath = path.join(IMAGE_DIR, d);
          try {
            if (fs.statSync(dirPath).isDirectory()) {
              const files = fs.readdirSync(dirPath).filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f));
              if (files.length > 0) existing.add(d.toUpperCase());
            }
          } catch {}
        }
        console.log(`Resume: ${existing.size} already downloaded\n`);
      } catch {}
    }

    const total = parts.length;
    let downloaded = 0;
    let skipped = 0;
    let errors = 0;
    let processed = 0;

    updateStatus({
      running: true,
      total,
      processed: 0,
      downloaded: 0,
      skipped: 0,
      errors: 0,
      startedAt: Date.now(),
      currentProduct: '',
      lastError: null,
    });

    if (!isResume) {
      if (fs.existsSync(ERROR_FILE)) fs.unlinkSync(ERROR_FILE);
    }

    // Process in batches
    for (let i = 0; i < parts.length; i += CONCURRENT) {
      if (shouldStop) {
        console.log('\nStopping gracefully...');
        break;
      }

      const batch = parts.slice(i, i + CONCURRENT);

      await Promise.all(
        batch.map(async (p) => {
          const partNumber = p.partNumber;
          const productDir = path.join(IMAGE_DIR, partNumber);
          const destPath = path.join(productDir, `${partNumber}_main.webp`);

          updateStatus({ currentProduct: partNumber });

          // Skip if already downloaded (resume)
          if (existing.has(partNumber.toUpperCase())) {
            skipped++;
            return;
          }
          if (fs.existsSync(destPath)) {
            skipped++;
            return;
          }

          // Try with retries
          for (let retry = 0; retry <= MAX_RETRIES; retry++) {
            try {
              const imgUrl = await getProductImageUrl(partNumber);
              await downloadImage(imgUrl, destPath);
              downloaded++;
              return;
            } catch (err) {
              if (retry === MAX_RETRIES) {
                errors++;
                logError(partNumber, err);
                updateStatus({ lastError: `${partNumber}: ${err.message}` });

                if (err.message.includes('429') || err.message.includes('403')) {
                  console.log(`\n*** Rate limited! Waiting 60 seconds... ***`);
                  await sleep(60000);
                }
                return;
              }
              await sleep(DELAY_ON_ERROR);
            }
          }
        })
      );

      processed = Math.min(i + CONCURRENT, parts.length);
      updateStatus({ processed, downloaded, skipped, errors });

      if (processed % 50 === 0 || isTest) {
        const pct = ((processed / total) * 100).toFixed(1);
        console.log(`Progress: ${processed}/${total} (${pct}%) | ${downloaded} downloaded, ${skipped} skipped, ${errors} errors`);
      }

      if (i + CONCURRENT < parts.length) {
        await sleep(DELAY_BETWEEN_BATCH);
      }
    }

    updateStatus({
      running: false,
      processed,
      downloaded,
      skipped,
      errors,
      currentProduct: '',
    });

    console.log('\n=== Complete ===');
    console.log(`Processed:  ${processed}/${total}`);
    console.log(`Downloaded: ${downloaded}`);
    console.log(`Skipped:    ${skipped}`);
    console.log(`Errors:     ${errors}`);
  } catch (err) {
    console.error('Fatal error:', err.message);
    updateStatus({ running: false, lastError: err.message });
  } finally {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  }
}

main();
