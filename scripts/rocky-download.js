/**
 * Rocky Brands Image Downloader
 *
 * Downloads product images from images.rockybrands.com Piwigo gallery.
 * Reads Excel files to get Supplier Part Numbers, searches the gallery,
 * and downloads all image angles (main, back, birdseye, front, profile, outsole, etc.)
 *
 * Supports: Georgia Boot, Rocky, Durango, XtraTuf, Muck, 4EurSole, Michelin, Ranger
 *
 * Usage:
 *   Start:    node scripts/rocky-download.js start
 *   Resume:   node scripts/rocky-download.js resume   (skip already downloaded)
 *   Status:   node scripts/rocky-download.js status
 *   Stop:     node scripts/rocky-download.js stop
 *   Errors:   node scripts/rocky-download.js errors
 *   Test:     node scripts/rocky-download.js test      (test with first 3 products)
 *
 * Environment:
 *   EXCEL_FILES  - Comma-separated Excel file paths (default: auto-detect GS Import*.xls files)
 *   IMAGE_DIR    - Output directory (default: public/uploads/rocky)
 *   CONCURRENT   - Concurrent downloads (default: 2)
 *   USE_API      - Use Piwigo API instead of scraping (default: true)
 *
 * Background: nohup node scripts/rocky-download.js start > /tmp/rocky-download.log 2>&1 &
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// ============ CONFIG ============
const IMAGE_DIR = process.env.IMAGE_DIR || path.join(process.cwd(), 'public/uploads/rocky');
const STATUS_FILE = '/tmp/rocky-status.json';
const ERROR_FILE = '/tmp/rocky-errors.json';
const PID_FILE = '/tmp/rocky-download.pid';
const GALLERY_BASE = 'https://images.rockybrands.com';

const CONCURRENT = parseInt(process.env.CONCURRENT) || 2;
const DELAY_BETWEEN_BATCH = 3000;   // ms between batches (be nice to the server)
const DELAY_BETWEEN_SEARCH = 2000;  // ms between search requests
const DELAY_ON_ERROR = 10000;       // ms delay on error
const MAX_RETRIES = 3;
const TIMEOUT = 45000;              // 45s per download
const USE_API = process.env.USE_API !== 'false';
// ================================

const command = process.argv[2] || 'status';

// ---- STATUS ----
if (command === 'status') {
  if (!fs.existsSync(STATUS_FILE)) {
    console.log('No download in progress. Run: node scripts/rocky-download.js start');
    process.exit(0);
  }
  const status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  const elapsed = status.running ? Math.round((Date.now() - status.startedAt) / 1000 / 60) : 0;
  console.log('=== Rocky Brands Image Download Status ===');
  console.log(`State:       ${status.running ? 'RUNNING' : 'STOPPED'}`);
  console.log(`Products:    ${status.productsProcessed}/${status.totalProducts}`);
  console.log(`Images:      ${status.downloaded} downloaded, ${status.skipped} skipped, ${status.errors} errors`);
  console.log(`Rate:        ~${elapsed > 0 ? Math.round(status.downloaded / elapsed) : 0} imgs/min`);
  console.log(`Elapsed:     ${elapsed} minutes`);
  if (status.currentProduct) {
    console.log(`Current:     ${status.currentProduct}`);
  }
  if (status.lastError) {
    console.log(`Last Error:  ${status.lastError}`);
  }
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
    console.log(`${e.partNumber} | ${e.error} | ${e.url?.substring(0, 80) || 'N/A'}`);
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
    } catch (e) {
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
  console.log('Usage: node scripts/rocky-download.js [start|resume|status|stop|errors|test]');
  process.exit(1);
}

const isResume = command === 'resume';
const isTest = command === 'test';

// ============ HTTP HELPERS ============

function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      timeout: options.timeout || TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': options.accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': GALLERY_BASE + '/',
        ...options.headers,
      },
    };

    if (options.body) {
      reqOptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = protocol.request(reqOptions, (res) => {
      // Follow redirects
      if ([301, 302, 303, 307].includes(res.statusCode) && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsedUrl.protocol}//${parsedUrl.host}${res.headers.location}`;
        httpRequest(redirectUrl, options).then(resolve).catch(reject);
        return;
      }

      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);

    if (options.body) req.write(options.body);
    req.end();
  });
}

function downloadFile(url, destPath, retries = 0) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const req = protocol.get(url, {
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'image/*,*/*',
        'Referer': GALLERY_BASE + '/',
      },
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsedUrl.protocol}//${parsedUrl.host}${res.headers.location}`;
        downloadFile(redirectUrl, destPath, retries).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode === 403 || res.statusCode === 429) {
        reject(new Error(`HTTP ${res.statusCode} - Rate limited`));
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
        if (stats.size < 1000) {
          fs.unlinkSync(destPath);
          reject(new Error('File too small - probably error page'));
        } else {
          resolve(stats.size);
        }
      });
      file.on('error', (err) => {
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(err);
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function updateStatus(updates) {
  let status = {};
  if (fs.existsSync(STATUS_FILE)) {
    try { status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8')); } catch {}
  }
  Object.assign(status, updates);
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
}

function logError(partNumber, url, error) {
  let errors = [];
  if (fs.existsSync(ERROR_FILE)) {
    try { errors = JSON.parse(fs.readFileSync(ERROR_FILE, 'utf8')); } catch {}
  }
  errors.push({ partNumber, url, error: error.toString(), time: new Date().toISOString() });
  fs.writeFileSync(ERROR_FILE, JSON.stringify(errors, null, 2));
}

// ============ EXCEL READER ============

function findExcelFiles() {
  if (process.env.EXCEL_FILES) {
    return process.env.EXCEL_FILES.split(',').map(f => f.trim());
  }

  // Auto-detect GS Import files
  const cwd = process.cwd();
  const files = fs.readdirSync(cwd).filter(f =>
    f.match(/GS\s*Import.*\.(xls|xlsx)$/i) ||
    f.match(/Rocky.*\.(xls|xlsx)$/i) ||
    f.match(/Georgia.*Boot.*\.(xls|xlsx)$/i)
  );

  if (files.length === 0) {
    throw new Error(
      'No Excel files found. Place "GS Import - *.xls" files in the project root,\n' +
      'or set EXCEL_FILES env var: EXCEL_FILES="file1.xls,file2.xls"'
    );
  }

  return files.map(f => path.join(cwd, f));
}

function readExcelProducts(filePath) {
  const XLSX = require('xlsx');
  console.log(`Reading: ${path.basename(filePath)}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) {
    console.log(`  Warning: No data rows found in ${path.basename(filePath)}`);
    return [];
  }

  // Show detected columns
  const headers = Object.keys(rows[0]);
  console.log(`  Columns: ${headers.length}, Rows: ${rows.length}`);

  const products = [];

  for (const row of rows) {
    // Find Supplier Part Number (the key for image search)
    const supplierPartNumber = (
      row['Supplier Part Number'] ||
      row['SupplierPartNumber'] ||
      row['Vendor Part Number'] ||
      row['Part Number'] ||
      row['Style'] ||
      ''
    ).toString().trim();

    // Find Product Code (used for folder naming)
    const productCode = (
      row['Product Code'] ||
      row['ProductCode'] ||
      row['Internal Part Number'] ||
      row['SKU'] ||
      row['Item Number'] ||
      ''
    ).toString().trim();

    // Find Brand
    const brand = (
      row['Brand'] ||
      row['Manufacturer'] ||
      ''
    ).toString().trim();

    if (supplierPartNumber && supplierPartNumber !== 'undefined') {
      products.push({
        supplierPartNumber,
        productCode: productCode || supplierPartNumber,
        brand,
        name: (row['Product Short Description'] || row['Name'] || '').toString().trim(),
      });
    }
  }

  console.log(`  Found ${products.length} products with Supplier Part Numbers`);
  return products;
}

// ============ PIWIGO SEARCH ============

/**
 * Search images via Piwigo REST API (ws.php)
 * Returns array of { name, url, elementUrl } for each image found
 */
async function searchPiwigoAPI(query) {
  try {
    const searchUrl = `${GALLERY_BASE}/ws.php?format=json&method=pwg.images.search&query=${encodeURIComponent(query)}&per_page=100`;

    const response = await httpRequest(searchUrl, {
      accept: 'application/json',
      timeout: 30000,
    });

    if (response.statusCode !== 200) {
      throw new Error(`API returned HTTP ${response.statusCode}`);
    }

    const data = JSON.parse(response.body);

    if (data.stat !== 'ok' || !data.result || !data.result.images) {
      throw new Error('Invalid API response');
    }

    return data.result.images.map(img => ({
      id: img.id,
      name: img.name || img.file || '',
      file: img.file || '',
      // element_url is the original full-size image
      elementUrl: img.element_url || '',
      // derivatives contain various sizes
      derivatives: img.derivatives || {},
      // Get the best available URL
      url: img.element_url ||
           (img.derivatives && img.derivatives.xxlarge && img.derivatives.xxlarge.url) ||
           (img.derivatives && img.derivatives.xlarge && img.derivatives.xlarge.url) ||
           (img.derivatives && img.derivatives.large && img.derivatives.large.url) ||
           '',
    }));
  } catch (err) {
    // API failed, try scraping
    return null;
  }
}

/**
 * Search images via Piwigo web search (HTML scraping fallback)
 * Submits search form, parses results page for image URLs
 */
async function searchPiwigoWeb(query) {
  try {
    // Step 1: Submit quick search to get search results page
    const searchUrl = `${GALLERY_BASE}/qsearch.php`;
    const response = await httpRequest(searchUrl, {
      method: 'POST',
      body: `q=${encodeURIComponent(query)}`,
      timeout: 30000,
    });

    let html = response.body;

    // If we got redirected to a search results page, that's the content
    // If not, try the GET search URL
    if (response.statusCode === 200 && html.length < 500) {
      // Try alternative search URL
      const altUrl = `${GALLERY_BASE}/index.php?/search&search=${encodeURIComponent(query)}`;
      const altResponse = await httpRequest(altUrl, { timeout: 30000 });
      html = altResponse.body;
    }

    // Step 2: Parse thumbnails from HTML
    // Piwigo thumbnails are in <img> tags inside <li> or <div> with class containing "thumb"
    const images = [];

    // Pattern 1: Piwigo standard thumbnail links
    // <a href="/picture.php?/12345/..."><img src="..._data/i/upload/...-th.jpg" alt="G050 back"></a>
    const thumbRegex = /<a[^>]*href=["']([^"']*picture\.php[^"']*)["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']*\.(jpg|jpeg|png|webp))["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi;
    let match;

    while ((match = thumbRegex.exec(html)) !== null) {
      const pageUrl = match[1];
      const thumbUrl = match[2];
      const alt = match[4] || '';

      // Convert thumbnail URL to full-size URL
      // Piwigo thumbnail: ...-th.jpg -> remove -th for original, or use -xx for xxlarge
      const fullUrl = thumbUrl
        .replace(/-th\.(jpg|jpeg|png|webp)$/i, '-xx.$1')
        .replace(/-sq\.(jpg|jpeg|png|webp)$/i, '-xx.$1')
        .replace(/-sm\.(jpg|jpeg|png|webp)$/i, '-xx.$1')
        .replace(/-me\.(jpg|jpeg|png|webp)$/i, '-xx.$1');

      images.push({
        name: alt || path.basename(thumbUrl, path.extname(thumbUrl)),
        url: fullUrl.startsWith('http') ? fullUrl : `${GALLERY_BASE}${fullUrl}`,
        thumbUrl: thumbUrl.startsWith('http') ? thumbUrl : `${GALLERY_BASE}${thumbUrl}`,
        pageUrl: pageUrl.startsWith('http') ? pageUrl : `${GALLERY_BASE}${pageUrl}`,
      });
    }

    // Pattern 2: Also try data-src for lazy-loaded images
    const lazySrcRegex = /<img[^>]*data-src=["']([^"']*\.(jpg|jpeg|png|webp))["'][^>]*(?:alt=["']([^"']*)["'])?/gi;
    while ((match = lazySrcRegex.exec(html)) !== null) {
      const thumbUrl = match[1];
      const alt = match[3] || '';
      const fullUrl = thumbUrl.replace(/-(th|sq|sm|me)\.(jpg|jpeg|png|webp)$/i, '-xx.$2');

      images.push({
        name: alt || path.basename(thumbUrl, path.extname(thumbUrl)),
        url: fullUrl.startsWith('http') ? fullUrl : `${GALLERY_BASE}${fullUrl}`,
      });
    }

    // Deduplicate by URL
    const seen = new Set();
    return images.filter(img => {
      if (seen.has(img.url)) return false;
      seen.add(img.url);
      return true;
    });
  } catch (err) {
    return [];
  }
}

/**
 * Try to get the original image URL from a Piwigo picture page
 * This is useful when we only have the derivative URL
 */
async function getOriginalFromPicturePage(pageUrl) {
  try {
    const response = await httpRequest(pageUrl, { timeout: 20000 });
    const html = response.body;

    // Look for the download link or original image URL
    // Pattern: <a href="...action=format&download&format_id=original..."
    const downloadMatch = html.match(/href=["']([^"']*(?:action=format|download)[^"']*)["']/i);
    if (downloadMatch) {
      const url = downloadMatch[1];
      return url.startsWith('http') ? url : `${GALLERY_BASE}${url}`;
    }

    // Pattern: <img id="theMainImage" src="..."
    const mainImgMatch = html.match(/<img[^>]*id=["']theMainImage["'][^>]*src=["']([^"']*)["']/i);
    if (mainImgMatch) {
      const url = mainImgMatch[1];
      return url.startsWith('http') ? url : `${GALLERY_BASE}${url}`;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Search for images of a product
 * Tries API first, falls back to web scraping
 */
async function searchProductImages(supplierPartNumber) {
  let images = null;

  // Try Piwigo API first
  if (USE_API) {
    images = await searchPiwigoAPI(supplierPartNumber);
    if (images && images.length > 0) {
      return images;
    }
  }

  // Fall back to web scraping
  images = await searchPiwigoWeb(supplierPartNumber);
  return images || [];
}

// ============ IMAGE NAME SANITIZER ============

function sanitizeImageName(name, partNumber) {
  // Extract the angle/type from the image name
  // e.g., "G050 back" -> "back", "G050 birdseye" -> "birdseye", "G050" -> "main"
  let cleanName = name
    .replace(new RegExp(`^${partNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  if (!cleanName || cleanName === partNumber.toLowerCase()) {
    cleanName = 'main';
  }

  return cleanName;
}

// ============ MAIN ============

async function main() {
  fs.writeFileSync(PID_FILE, process.pid.toString());

  let shouldStop = false;
  process.on('SIGTERM', () => { shouldStop = true; });
  process.on('SIGINT', () => { shouldStop = true; });

  console.log('=== Rocky Brands Image Downloader ===');
  console.log(`Mode: ${isTest ? 'TEST (first 3 products)' : isResume ? 'RESUME' : 'START'}`);
  console.log(`Gallery: ${GALLERY_BASE}`);
  console.log(`Output: ${IMAGE_DIR}`);
  console.log(`Concurrent: ${CONCURRENT}\n`);

  try {
    // Read Excel files
    const excelFiles = findExcelFiles();
    console.log(`Found ${excelFiles.length} Excel file(s):\n`);

    let allProducts = [];
    for (const file of excelFiles) {
      const products = readExcelProducts(file);
      allProducts = allProducts.concat(products);
    }

    // Deduplicate by supplier part number
    const seen = new Set();
    allProducts = allProducts.filter(p => {
      const key = p.supplierPartNumber.toUpperCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`\nTotal unique products: ${allProducts.length}`);

    if (isTest) {
      allProducts = allProducts.slice(0, 3);
      console.log(`Test mode: processing first ${allProducts.length} products only\n`);
    }

    // Create output directory
    if (!fs.existsSync(IMAGE_DIR)) {
      fs.mkdirSync(IMAGE_DIR, { recursive: true });
    }

    // Get already downloaded products (for resume)
    const existingProducts = new Set();
    if (isResume && fs.existsSync(IMAGE_DIR)) {
      const dirs = fs.readdirSync(IMAGE_DIR).filter(d =>
        fs.statSync(path.join(IMAGE_DIR, d)).isDirectory()
      );
      dirs.forEach(d => existingProducts.add(d.toUpperCase()));
    }

    // Initialize status
    let downloaded = 0;
    let skipped = 0;
    let errors = 0;
    let productsProcessed = 0;
    let searchFailed = 0;
    let noResults = 0;

    updateStatus({
      running: true,
      totalProducts: allProducts.length,
      productsProcessed: 0,
      downloaded: 0,
      skipped: 0,
      errors: 0,
      searchFailed: 0,
      noResults: 0,
      startedAt: Date.now(),
      currentProduct: '',
      lastError: null,
      method: USE_API ? 'Piwigo API' : 'Web Scraping',
    });

    if (!isResume) {
      if (fs.existsSync(ERROR_FILE)) fs.unlinkSync(ERROR_FILE);
    }

    // Process products
    for (let i = 0; i < allProducts.length; i++) {
      if (shouldStop) {
        console.log('\nStopping gracefully...');
        break;
      }

      const product = allProducts[i];
      const partNumber = product.supplierPartNumber;
      const productDir = path.join(IMAGE_DIR, partNumber);

      updateStatus({ currentProduct: `${partNumber} (${i + 1}/${allProducts.length})` });

      // Skip if already downloaded (resume mode)
      if (isResume && existingProducts.has(partNumber.toUpperCase())) {
        // Check if directory has images
        if (fs.existsSync(productDir) && fs.readdirSync(productDir).length > 0) {
          skipped++;
          productsProcessed++;
          updateStatus({ productsProcessed, skipped });
          continue;
        }
      }

      // Search for images
      let images;
      try {
        images = await searchProductImages(partNumber);
      } catch (err) {
        searchFailed++;
        errors++;
        logError(partNumber, '', `Search failed: ${err.message}`);
        updateStatus({ errors, searchFailed, lastError: `${partNumber}: Search failed - ${err.message}` });
        productsProcessed++;
        updateStatus({ productsProcessed });
        await sleep(DELAY_ON_ERROR);
        continue;
      }

      if (!images || images.length === 0) {
        noResults++;
        logError(partNumber, '', 'No images found in gallery');
        updateStatus({ noResults, lastError: `${partNumber}: No images found` });
        productsProcessed++;
        updateStatus({ productsProcessed });
        await sleep(DELAY_BETWEEN_SEARCH);
        continue;
      }

      console.log(`${partNumber}: Found ${images.length} images`);

      // Create product directory
      if (!fs.existsSync(productDir)) {
        fs.mkdirSync(productDir, { recursive: true });
      }

      // Download images in batches
      for (let j = 0; j < images.length; j += CONCURRENT) {
        if (shouldStop) break;

        const batch = images.slice(j, j + CONCURRENT);

        const promises = batch.map(async (img) => {
          const imageName = sanitizeImageName(img.name || img.file || '', partNumber);
          const ext = path.extname(img.url || '.jpg') || '.jpg';
          const filename = `${partNumber}_${imageName}${ext}`.replace(/\?.*$/, '');
          const destPath = path.join(productDir, filename);

          // Skip if file exists
          if (fs.existsSync(destPath)) {
            skipped++;
            return 'skipped';
          }

          if (!img.url) {
            errors++;
            logError(partNumber, '', `No URL for image: ${img.name}`);
            return 'error';
          }

          // Download with retries
          for (let retry = 0; retry <= MAX_RETRIES; retry++) {
            try {
              const size = await downloadFile(img.url, destPath);
              downloaded++;
              return 'ok';
            } catch (err) {
              // If xxlarge fails, try without size suffix (original)
              if (retry === 0 && img.url.includes('-xx.')) {
                const originalUrl = img.url.replace(/-xx\.(jpg|jpeg|png|webp)$/i, '.$1');
                try {
                  const size = await downloadFile(originalUrl, destPath);
                  downloaded++;
                  return 'ok';
                } catch {}
              }

              // If original fails, try large derivative
              if (retry === 1 && img.url.includes('-xx.')) {
                const largeUrl = img.url.replace(/-xx\.(jpg|jpeg|png|webp)$/i, '-la.$1');
                try {
                  const size = await downloadFile(largeUrl, destPath);
                  downloaded++;
                  return 'ok';
                } catch {}
              }

              if (retry === MAX_RETRIES) {
                errors++;
                logError(partNumber, img.url, err);
                updateStatus({
                  lastError: `${partNumber}: ${err.message}`,
                });

                if (err.message.includes('403') || err.message.includes('429')) {
                  console.log(`\n*** Rate limited! Waiting 60 seconds... ***`);
                  await sleep(60000);
                }
                return 'error';
              }
              await sleep(DELAY_ON_ERROR);
            }
          }
        });

        await Promise.all(promises);
        updateStatus({ downloaded, skipped, errors });

        if (j + CONCURRENT < images.length) {
          await sleep(DELAY_BETWEEN_BATCH);
        }
      }

      productsProcessed++;
      updateStatus({ productsProcessed, downloaded, skipped, errors, searchFailed, noResults });

      // Progress log
      const pct = ((productsProcessed / allProducts.length) * 100).toFixed(1);
      if (productsProcessed % 10 === 0 || isTest) {
        console.log(`Progress: ${productsProcessed}/${allProducts.length} products (${pct}%) | ${downloaded} imgs downloaded, ${errors} errors`);
      }

      // Delay before next search
      await sleep(DELAY_BETWEEN_SEARCH);
    }

    // Final status
    updateStatus({
      running: false,
      productsProcessed,
      downloaded,
      skipped,
      errors,
      searchFailed,
      noResults,
      currentProduct: '',
    });

    console.log(`\n=== Complete ===`);
    console.log(`Products processed: ${productsProcessed}/${allProducts.length}`);
    console.log(`Images downloaded:  ${downloaded}`);
    console.log(`Skipped:            ${skipped}`);
    console.log(`Errors:             ${errors}`);
    console.log(`No results:         ${noResults}`);
    console.log(`Search failed:      ${searchFailed}`);

  } catch (err) {
    console.error('Fatal error:', err.message);
    updateStatus({ running: false, lastError: err.message });
  } finally {
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  }
}

main();
