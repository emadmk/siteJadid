/**
 * Grainger HQ Image Downloader
 *
 * Downloads HIGH QUALITY (original) images by removing ?$s7product$ from URLs.
 * Saves to a separate directory with _HQ suffix.
 *
 * Usage:
 *   Start:    node scripts/grainger-download-hq.js start
 *   Status:   node scripts/grainger-download-hq.js status
 *   Stop:     node scripts/grainger-download-hq.js stop
 *   Errors:   node scripts/grainger-download-hq.js errors
 *   Resume:   node scripts/grainger-download-hq.js resume
 *
 * Background: nohup node scripts/grainger-download-hq.js start > /tmp/grainger-hq.log 2>&1 &
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ============ CONFIG ============
const EXCEL_FILE = process.env.EXCEL_FILE || 'Purchase_History_Enriched_20260317_123850 2.xlsx';
const IMAGE_DIR = path.join(process.cwd(), 'public/uploads/grainger-hq');
const STATUS_FILE = '/tmp/grainger-hq-status.json';
const ERROR_FILE = '/tmp/grainger-hq-errors.json';
const PID_FILE = '/tmp/grainger-hq-download.pid';
const LOG_FILE = '/tmp/grainger-hq.log';

const CONCURRENT = 3;
const DELAY_BETWEEN_BATCH = 2000;
const DELAY_ON_ERROR = 10000;
const MAX_RETRIES = 3;
const TIMEOUT = 60000; // 60s for HQ images (larger files)
// ================================

const command = process.argv[2] || 'status';

// ---- STATUS ----
if (command === 'status') {
  if (!fs.existsSync(STATUS_FILE)) {
    console.log('No HQ download in progress. Run: node scripts/grainger-download-hq.js start');
    process.exit(0);
  }
  const status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  const elapsed = status.running ? Math.round((Date.now() - status.startedAt) / 1000 / 60) : 0;
  console.log('=== Grainger HQ Image Download Status ===');
  console.log(`State:       ${status.running ? 'RUNNING' : 'STOPPED'}`);
  console.log(`Progress:    ${status.downloaded}/${status.total} (${((status.downloaded / Math.max(status.total, 1)) * 100).toFixed(1)}%)`);
  console.log(`Skipped:     ${status.skipped} (already exists / no URL)`);
  console.log(`Errors:      ${status.errors}`);
  console.log(`Rate:        ~${elapsed > 0 ? Math.round(status.downloaded / elapsed) : 0} imgs/min`);
  console.log(`Elapsed:     ${elapsed} minutes`);
  if (status.lastError) console.log(`Last Error:  ${status.lastError}`);
  if (status.banned) console.log(`\n*** WARNING: Possible IP ban detected! ***`);
  process.exit(0);
}

// ---- ERRORS ----
if (command === 'errors') {
  if (!fs.existsSync(ERROR_FILE)) { console.log('No errors.'); process.exit(0); }
  const errors = JSON.parse(fs.readFileSync(ERROR_FILE, 'utf8'));
  console.log(`=== ${errors.length} Errors ===\n`);
  errors.slice(-50).forEach(e => console.log(`${e.sku} | ${e.error}`));
  if (errors.length > 50) console.log(`\n... showing last 50 of ${errors.length}`);
  process.exit(0);
}

// ---- STOP ----
if (command === 'stop') {
  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
    try { process.kill(parseInt(pid), 'SIGTERM'); console.log(`Stopped PID ${pid}`); } catch { console.log('Not running.'); }
    fs.unlinkSync(PID_FILE);
  }
  if (fs.existsSync(STATUS_FILE)) {
    const s = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    s.running = false;
    fs.writeFileSync(STATUS_FILE, JSON.stringify(s, null, 2));
  }
  process.exit(0);
}

if (command !== 'start' && command !== 'resume') {
  console.log('Usage: node scripts/grainger-download-hq.js [start|resume|status|stop|errors]');
  process.exit(1);
}

const isResume = command === 'resume';

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, {
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*',
        'Referer': 'https://www.grainger.com/',
      },
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode === 403 || res.statusCode === 429) {
        reject(new Error(`HTTP ${res.statusCode} - Rate limit/ban`));
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(destPath);
        if (stats.size < 1000) { fs.unlinkSync(destPath); reject(new Error('File too small')); }
        else resolve(stats.size);
      });
      file.on('error', (err) => { fs.unlinkSync(destPath); reject(err); });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function updateStatus(updates) {
  let s = {};
  if (fs.existsSync(STATUS_FILE)) s = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  Object.assign(s, updates);
  fs.writeFileSync(STATUS_FILE, JSON.stringify(s, null, 2));
}

function logError(sku, url, error) {
  let errors = [];
  if (fs.existsSync(ERROR_FILE)) errors = JSON.parse(fs.readFileSync(ERROR_FILE, 'utf8'));
  errors.push({ sku, url, error: error.toString(), time: new Date().toISOString() });
  fs.writeFileSync(ERROR_FILE, JSON.stringify(errors, null, 2));
}

async function main() {
  fs.writeFileSync(PID_FILE, process.pid.toString());

  let shouldStop = false;
  process.on('SIGTERM', () => { shouldStop = true; });
  process.on('SIGINT', () => { shouldStop = true; });

  console.log('=== Grainger HQ Image Downloader ===');
  console.log(`Mode: ${isResume ? 'RESUME' : 'START'}\n`);

  try {
    const { execSync } = require('child_process');
    console.log('Reading Excel file...');

    const pythonScript = `
import openpyxl
import json

wb = openpyxl.load_workbook('${EXCEL_FILE}', read_only=True, data_only=True)
ws = wb.active

headers = [cell.value for cell in next(ws.iter_rows(min_row=1, max_row=1))]
img_col = None
sku_col = 0

for i, h in enumerate(headers):
    if h and 'DB_Image_URL' in str(h):
        img_col = i
        break
    if h and 'Image' in str(h) and 'URL' in str(h):
        img_col = i
        break

if img_col is None:
    img_col = 37

items = []
for row in ws.iter_rows(min_row=2, values_only=True):
    sku = str(row[sku_col]).strip() if row[sku_col] else None
    url = str(row[img_col]).strip() if row[img_col] and str(row[img_col]).startswith('http') else None
    if sku and url:
        # Remove ?$s7product$ to get HQ version
        clean_url = url.split('?')[0]
        items.append({'sku': sku, 'url': clean_url})

wb.close()
print(json.dumps(items))
`;

    const tmpPy = '/tmp/grainger_extract_hq.py';
    fs.writeFileSync(tmpPy, pythonScript);

    const result = execSync(`python3 ${tmpPy}`, {
      maxBuffer: 500 * 1024 * 1024,
      timeout: 300000,
    });

    const items = JSON.parse(result.toString());
    console.log(`Found ${items.length} products with image URLs (HQ mode)\n`);

    if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });

    // Get already downloaded files (for resume)
    const existing = new Set();
    if (fs.existsSync(IMAGE_DIR)) {
      fs.readdirSync(IMAGE_DIR).forEach(f => existing.add(f.replace(/\.[^.]+$/, '')));
    }

    const total = items.length;
    let downloaded = 0;
    let skipped = 0;
    let errors = 0;

    updateStatus({
      running: true, total, downloaded: 0, skipped: 0, errors: 0,
      startedAt: Date.now(), banned: false, lastError: null,
    });

    if (!isResume && fs.existsSync(ERROR_FILE)) fs.unlinkSync(ERROR_FILE);

    for (let i = 0; i < items.length; i += CONCURRENT) {
      if (shouldStop) { console.log('\nStopping...'); break; }

      const batch = items.slice(i, i + CONCURRENT);

      const promises = batch.map(async (item) => {
        const filename = `${item.sku}_HQ.jpg`;
        const destPath = path.join(IMAGE_DIR, filename);

        if (existing.has(`${item.sku}_HQ`) || fs.existsSync(destPath)) {
          skipped++;
          return 'skipped';
        }

        if (!item.url || !item.url.startsWith('http')) {
          skipped++;
          return 'skipped';
        }

        for (let retry = 0; retry <= MAX_RETRIES; retry++) {
          try {
            await downloadFile(item.url, destPath);
            downloaded++;
            return 'ok';
          } catch (err) {
            if (retry === MAX_RETRIES) {
              errors++;
              logError(item.sku, item.url, err);
              updateStatus({
                lastError: `${item.sku}: ${err.message}`,
                banned: err.message.includes('403') || err.message.includes('429'),
              });
              if (err.message.includes('403') || err.message.includes('429')) {
                console.log(`\n*** Rate limited! Waiting 60s... ***`);
                await sleep(60000);
              }
              return 'error';
            }
            await sleep(DELAY_ON_ERROR);
          }
        }
      });

      await Promise.all(promises);
      updateStatus({ downloaded, skipped, errors, running: !shouldStop });

      if ((i + CONCURRENT) % 100 < CONCURRENT) {
        const pct = (((downloaded + skipped) / total) * 100).toFixed(1);
        console.log(`Progress: ${downloaded} downloaded, ${skipped} skipped, ${errors} errors (${pct}%)`);
      }

      await sleep(DELAY_BETWEEN_BATCH);
    }

    updateStatus({ running: false, downloaded, skipped, errors });
    console.log(`\n=== Complete ===`);
    console.log(`Downloaded: ${downloaded}`);
    console.log(`Skipped:    ${skipped}`);
    console.log(`Errors:     ${errors}`);
    console.log(`Total:      ${total}`);

  } catch (err) {
    console.error('Fatal error:', err.message);
    updateStatus({ running: false, lastError: err.message });
  } finally {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  }
}

main();
