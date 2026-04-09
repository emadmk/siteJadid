/**
 * Rocky Brands Image Download Dashboard
 *
 * Web panel to monitor and control the Rocky Brands image downloader.
 * Run with PM2: pm2 start scripts/rocky-dashboard.js --name rocky-dashboard
 * Access at: http://YOUR_SERVER_IP:9877
 * Password: 110110
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const PORT = 9877;
const PASSWORD = '110110';

const STATUS_FILE = '/tmp/rocky-status.json';
const ERROR_FILE = '/tmp/rocky-errors.json';
const PID_FILE = '/tmp/rocky-download.pid';
const LOG_FILE = '/tmp/rocky-download.log';
const SCRIPT_PATH = path.join(__dirname, 'rocky-download.js');
const IMAGE_DIR = path.join(process.cwd(), 'public/uploads/rocky');

function getStatus() {
  try {
    if (!fs.existsSync(STATUS_FILE)) return null;
    return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  } catch { return null; }
}

function getErrors() {
  try {
    if (!fs.existsSync(ERROR_FILE)) return [];
    return JSON.parse(fs.readFileSync(ERROR_FILE, 'utf8'));
  } catch { return []; }
}

function getRecentLog(lines = 30) {
  try {
    if (!fs.existsSync(LOG_FILE)) return '';
    return execSync(`tail -${lines} "${LOG_FILE}" 2>/dev/null`).toString();
  } catch { return ''; }
}

function isRunning() {
  try {
    if (!fs.existsSync(PID_FILE)) return false;
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim());
    process.kill(pid, 0);
    return true;
  } catch { return false; }
}

function getDiskUsage() {
  try {
    if (!fs.existsSync(IMAGE_DIR)) return { files: 0, folders: 0, size: '0 MB' };
    const folders = fs.readdirSync(IMAGE_DIR).filter(d => {
      try { return fs.statSync(path.join(IMAGE_DIR, d)).isDirectory(); } catch { return false; }
    }).length;
    let files = 0;
    try {
      const result = execSync(`find "${IMAGE_DIR}" -type f | wc -l 2>/dev/null`).toString().trim();
      files = parseInt(result) || 0;
    } catch {}
    let size = '0 MB';
    try {
      size = execSync(`du -sh "${IMAGE_DIR}" 2>/dev/null`).toString().split('\t')[0].trim();
    } catch {}
    return { files, folders, size };
  } catch { return { files: 0, folders: 0, size: '0 MB' }; }
}

function renderPage(authenticated, action) {
  const status = getStatus();
  const running = isRunning();
  const disk = getDiskUsage();
  const errors = getErrors();
  const recentErrors = errors.slice(-10).reverse();
  const log = getRecentLog(25);

  const totalProducts = status ? status.totalProducts : 0;
  const productsProcessed = status ? status.productsProcessed : 0;
  const pctProducts = totalProducts > 0 ? ((productsProcessed / totalProducts) * 100).toFixed(1) : 0;
  const elapsed = status && status.startedAt ? Math.round((Date.now() - status.startedAt) / 60000) : 0;
  const rate = elapsed > 0 && status ? Math.round(status.downloaded / elapsed) : 0;
  const productRate = elapsed > 0 ? Math.round(productsProcessed / elapsed) : 0;
  const etaProducts = productRate > 0 && status ? Math.round((totalProducts - productsProcessed) / productRate) : 0;

  // Count error types
  const noResultCount = status ? (status.noResults || 0) : 0;
  const searchFailCount = status ? (status.searchFailed || 0) : 0;

  if (!authenticated) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rocky Dashboard - Login</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh}
.login{background:#1e293b;padding:40px;border-radius:16px;width:340px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
h1{color:#f97316;font-size:20px;margin-bottom:8px}p{color:#94a3b8;font-size:13px;margin-bottom:24px}
input{width:100%;padding:12px 16px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#fff;font-size:15px;margin-bottom:16px}
input:focus{outline:none;border-color:#f97316}
button{width:100%;padding:12px;background:#f97316;color:#fff;font-weight:600;border:none;border-radius:8px;cursor:pointer;font-size:15px}
button:hover{background:#ea580c}.err{color:#ef4444;font-size:13px;margin-bottom:12px}</style></head>
<body><div class="login"><h1>Rocky Brands Dashboard</h1><p>Image download monitor</p>
${action === 'wrong' ? '<div class="err">Wrong password</div>' : ''}
<form method="POST"><input type="password" name="password" placeholder="Password" autofocus>
<button type="submit">Login</button></form></div></body></html>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rocky Brands Download Dashboard</title>
<meta http-equiv="refresh" content="10">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:20px;max-width:1200px;margin:0 auto}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
h1{font-size:22px;color:#f97316}
.subtitle{color:#94a3b8;font-size:13px}
.badge{padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600}
.running{background:#22c55e20;color:#22c55e;border:1px solid #22c55e40}
.stopped{background:#ef444420;color:#ef4444;border:1px solid #ef444440}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px}
.card{background:#1e293b;padding:16px;border-radius:12px;border:1px solid #334155}
.card .value{font-size:24px;font-weight:700;color:#fff;margin-bottom:4px}
.card .label{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px}
.card.green .value{color:#22c55e}
.card.red .value{color:#ef4444}
.card.blue .value{color:#3b82f6}
.card.yellow .value{color:#eab308}
.card.orange .value{color:#f97316}
.card.purple .value{color:#a855f7}
.progress-wrap{background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #334155}
.progress-bar{height:24px;background:#334155;border-radius:12px;overflow:hidden;margin-top:12px}
.progress-fill{height:100%;background:linear-gradient(90deg,#f97316,#ea580c);border-radius:12px;transition:width .5s;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff}
.actions{display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap}
.btn{padding:10px 20px;border-radius:8px;border:none;font-weight:600;cursor:pointer;font-size:14px;text-decoration:none;display:inline-block}
.btn-green{background:#22c55e;color:#000}.btn-green:hover{background:#16a34a}
.btn-red{background:#ef4444;color:#fff}.btn-red:hover{background:#dc2626}
.btn-blue{background:#3b82f6;color:#fff}.btn-blue:hover{background:#2563eb}
.btn-orange{background:#f97316;color:#fff}.btn-orange:hover{background:#ea580c}
.btn-gray{background:#475569;color:#fff}.btn-gray:hover{background:#64748b}
.section{background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #334155}
.section h2{font-size:16px;margin-bottom:12px;color:#94a3b8}
table{width:100%;border-collapse:collapse}
td,th{padding:8px 12px;text-align:left;font-size:13px;border-bottom:1px solid #334155}
th{color:#94a3b8;font-size:11px;text-transform:uppercase}
.log{background:#0f172a;padding:16px;border-radius:8px;font-family:'SF Mono',Monaco,monospace;font-size:12px;line-height:1.6;max-height:400px;overflow-y:auto;white-space:pre-wrap;color:#94a3b8}
.warn{color:#eab308;font-weight:600;padding:12px;background:#eab30810;border-radius:8px;margin-bottom:16px;border:1px solid #eab30830}
.current{color:#f97316;font-size:14px;margin-bottom:16px;padding:12px;background:#f9731610;border-radius:8px;border:1px solid #f9731630}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:24px}
@media(max-width:768px){.two-col{grid-template-columns:1fr}}
</style></head>
<body>
<div class="header">
  <div>
    <h1>Rocky Brands Image Downloader</h1>
    <div class="subtitle">Georgia Boot | Rocky | Durango | XtraTuf | Muck | Michelin | Ranger</div>
  </div>
  <span class="badge ${running ? 'running' : 'stopped'}">${running ? 'RUNNING' : 'STOPPED'}</span>
</div>

${action === 'started' ? '<div class="warn" style="color:#22c55e;background:#22c55e10;border-color:#22c55e30">Download started!</div>' : ''}
${action === 'stopped' ? '<div class="warn" style="color:#ef4444;background:#ef444410;border-color:#ef444430">Download stopped.</div>' : ''}
${action === 'test-started' ? '<div class="warn" style="color:#3b82f6;background:#3b82f610;border-color:#3b82f630">Test mode started (first 3 products only)</div>' : ''}

${status && status.currentProduct ? `<div class="current">Currently processing: <strong>${status.currentProduct}</strong></div>` : ''}

<div class="grid">
  <div class="card orange"><div class="value">${productsProcessed.toLocaleString()}/${totalProducts.toLocaleString()}</div><div class="label">Products</div></div>
  <div class="card green"><div class="value">${status ? status.downloaded.toLocaleString() : 0}</div><div class="label">Images Downloaded</div></div>
  <div class="card"><div class="value">${status ? (status.skipped || 0).toLocaleString() : 0}</div><div class="label">Skipped</div></div>
  <div class="card red"><div class="value">${status ? status.errors : 0}</div><div class="label">Errors</div></div>
  <div class="card purple"><div class="value">${noResultCount}</div><div class="label">No Results</div></div>
  <div class="card yellow"><div class="value">${rate}/min</div><div class="label">Img Speed</div></div>
  <div class="card blue"><div class="value">${disk.folders.toLocaleString()}</div><div class="label">Folders</div></div>
  <div class="card"><div class="value">${disk.files.toLocaleString()}</div><div class="label">Files</div></div>
  <div class="card"><div class="value">${disk.size}</div><div class="label">Disk Used</div></div>
  <div class="card"><div class="value">${etaProducts > 0 ? etaProducts + 'm' : '-'}</div><div class="label">ETA</div></div>
</div>

<div class="progress-wrap">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <span>Products Progress</span>
    <span style="font-size:14px;font-weight:700;color:#f97316">${pctProducts}%</span>
  </div>
  <div class="progress-bar">
    <div class="progress-fill" style="width:${pctProducts}%">${pctProducts > 5 ? pctProducts + '%' : ''}</div>
  </div>
</div>

<div class="actions">
  ${!running ? `<a href="?action=start&token=${PASSWORD}" class="btn btn-green">Start Download</a>` : ''}
  ${!running ? `<a href="?action=resume&token=${PASSWORD}" class="btn btn-blue">Resume Download</a>` : ''}
  ${!running ? `<a href="?action=test&token=${PASSWORD}" class="btn btn-orange">Test (3 products)</a>` : ''}
  ${running ? `<a href="?action=stop&token=${PASSWORD}" class="btn btn-red">Stop Download</a>` : ''}
  <a href="?token=${PASSWORD}" class="btn btn-gray">Refresh</a>
</div>

<div class="two-col">

${recentErrors.length > 0 ? `
<div class="section">
  <h2>Recent Errors (${errors.length} total)</h2>
  <table>
    <tr><th>Time</th><th>Part #</th><th>Error</th></tr>
    ${recentErrors.map(e => `<tr>
      <td style="white-space:nowrap">${new Date(e.time).toLocaleTimeString()}</td>
      <td><strong>${e.partNumber}</strong></td>
      <td style="color:#ef4444;max-width:300px;overflow:hidden;text-overflow:ellipsis">${e.error}</td>
    </tr>`).join('')}
  </table>
</div>` : '<div class="section"><h2>Errors</h2><p style="color:#64748b">No errors yet.</p></div>'}

<div class="section">
  <h2>Recent Log</h2>
  <div class="log">${log || 'No log output yet. Start a download to see logs.'}</div>
</div>

</div>

<div class="section" style="margin-top:24px">
  <h2>Setup Instructions</h2>
  <div class="log" style="color:#94a3b8">
1. Place Excel files in the project root:
   - "GS Import - Georgia Boots (Apr-26).xls"
   - "GS Import - Rocky (Apr-26).xls"

2. Install dependencies (if not already):
   npm install xlsx

3. Start the download:
   - Click "Test (3 products)" first to verify everything works
   - Then click "Start Download" for the full run
   - Use "Resume" to continue after interruption

4. Or run from terminal:
   cd /var/www/siteJadid
   nohup node scripts/rocky-download.js start > /tmp/rocky-download.log 2>&1 &

5. Custom Excel files:
   EXCEL_FILES="file1.xls,file2.xls" node scripts/rocky-download.js start

6. Images are saved to: public/uploads/rocky/{PartNumber}/
   e.g., public/uploads/rocky/G050/G050_main.jpg
         public/uploads/rocky/G050/G050_back.jpg
         public/uploads/rocky/G050/G050_front.jpg
  </div>
</div>

<div style="text-align:center;color:#475569;font-size:12px;margin-top:20px">
  Auto-refreshes every 10 seconds &bull; Method: ${status ? (status.method || 'Piwigo API') : 'Piwigo API'} &bull; <a href="/" style="color:#64748b">Logout</a>
</div>
</body></html>`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  const action = url.searchParams.get('action');

  // Handle POST login
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const pw = params.get('password');
      if (pw === PASSWORD) {
        res.writeHead(302, { Location: `/?token=${PASSWORD}` });
        res.end();
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(renderPage(false, 'wrong'));
      }
    });
    return;
  }

  // Check auth
  if (token !== PASSWORD) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(renderPage(false));
    return;
  }

  // Handle actions
  if (action === 'start' || action === 'resume' || action === 'test') {
    const mode = action;
    const child = spawn('node', [SCRIPT_PATH, mode], {
      cwd: process.cwd(),
      detached: true,
      stdio: ['ignore', fs.openSync(LOG_FILE, 'a'), fs.openSync(LOG_FILE, 'a')],
    });
    child.unref();
    const actionLabel = action === 'test' ? 'test-started' : 'started';
    res.writeHead(302, { Location: `/?token=${PASSWORD}&action=${actionLabel}` });
    res.end();
    return;
  }

  if (action === 'stop') {
    try {
      if (fs.existsSync(PID_FILE)) {
        const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim());
        process.kill(pid, 'SIGTERM');
      }
    } catch {}
    res.writeHead(302, { Location: `/?token=${PASSWORD}&action=stopped` });
    res.end();
    return;
  }

  // Render dashboard
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(renderPage(true));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Rocky Brands Dashboard running at http://0.0.0.0:${PORT}\n  Password: ${PASSWORD}\n`);
});
