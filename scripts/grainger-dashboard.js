/**
 * Grainger Image Download Dashboard
 *
 * A simple web panel to monitor and control the Grainger image downloader.
 * Run with PM2: pm2 start scripts/grainger-dashboard.js --name grainger-dashboard
 * Access at: http://YOUR_SERVER_IP:9876
 * Password: 110110
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const PORT = 9876;
const PASSWORD = '110110';

// Standard quality downloader
const STATUS_FILE = '/tmp/grainger-status.json';
const ERROR_FILE = '/tmp/grainger-errors.json';
const PID_FILE = '/tmp/grainger-download.pid';
const LOG_FILE = '/tmp/grainger-download.log';
const SCRIPT_PATH = path.join(__dirname, 'grainger-download.js');
const IMAGE_DIR = path.join(process.cwd(), 'public/uploads/grainger');

// HQ downloader
const HQ_STATUS_FILE = '/tmp/grainger-hq-status.json';
const HQ_ERROR_FILE = '/tmp/grainger-hq-errors.json';
const HQ_PID_FILE = '/tmp/grainger-hq-download.pid';
const HQ_LOG_FILE = '/tmp/grainger-hq.log';
const HQ_SCRIPT_PATH = path.join(__dirname, 'grainger-download-hq.js');
const HQ_IMAGE_DIR = path.join(process.cwd(), 'public/uploads/grainger-hq');

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
    const content = execSync(`tail -${lines} "${LOG_FILE}" 2>/dev/null`).toString();
    return content;
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
    if (!fs.existsSync(IMAGE_DIR)) return { files: 0, size: '0 MB' };
    const files = fs.readdirSync(IMAGE_DIR).length;
    const result = execSync(`du -sh "${IMAGE_DIR}" 2>/dev/null`).toString().split('\t')[0];
    return { files, size: result.trim() };
  } catch { return { files: 0, size: '0 MB' }; }
}

function getStatusFor(file) {
  try { if (!fs.existsSync(file)) return null; return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}
function getErrorsFor(file) {
  try { if (!fs.existsSync(file)) return []; return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}
function isRunningFor(pidFile) {
  try { if (!fs.existsSync(pidFile)) return false; const pid = parseInt(fs.readFileSync(pidFile, 'utf8').trim()); process.kill(pid, 0); return true; } catch { return false; }
}
function getDiskFor(dir) {
  try { if (!fs.existsSync(dir)) return { files: 0, size: '0 MB' }; const files = fs.readdirSync(dir).length; const r = execSync(`du -sh "${dir}" 2>/dev/null`).toString().split('\t')[0]; return { files, size: r.trim() }; } catch { return { files: 0, size: '0 MB' }; }
}
function getLogFor(file, lines = 20) {
  try { if (!fs.existsSync(file)) return ''; return execSync(`tail -${lines} "${file}" 2>/dev/null`).toString(); } catch { return ''; }
}

function renderPanel(label, statusFile, errorFile, pidFile, logFile, imageDir, startAction, resumeAction, stopAction, token) {
  const status = getStatusFor(statusFile);
  const running = isRunningFor(pidFile);
  const disk = getDiskFor(imageDir);
  const errors = getErrorsFor(errorFile);
  const recentErrors = errors.slice(-5).reverse();
  const log = getLogFor(logFile, 10);
  const pct = status ? ((status.downloaded / Math.max(status.total, 1)) * 100).toFixed(1) : 0;
  const elapsed = status && status.startedAt ? Math.round((Date.now() - status.startedAt) / 60000) : 0;
  const rate = elapsed > 0 && status ? Math.round(status.downloaded / elapsed) : 0;
  const eta = rate > 0 && status ? Math.round((status.total - status.downloaded - status.skipped) / rate) : 0;

  return `
<div style="margin-bottom:32px">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <h2 style="font-size:18px;color:#fff;margin:0">${label}</h2>
    <span class="badge ${running ? 'running' : 'stopped'}">${running ? 'RUNNING' : 'STOPPED'}</span>
  </div>
  ${status && status.banned ? '<div class="warn">WARNING: Possible IP ban detected!</div>' : ''}
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr))">
    <div class="card green"><div class="value">${status ? status.downloaded.toLocaleString() : 0}</div><div class="label">Downloaded</div></div>
    <div class="card blue"><div class="value">${status ? status.total.toLocaleString() : 0}</div><div class="label">Total</div></div>
    <div class="card"><div class="value">${status ? status.skipped.toLocaleString() : 0}</div><div class="label">Skipped</div></div>
    <div class="card red"><div class="value">${status ? status.errors : 0}</div><div class="label">Errors</div></div>
    <div class="card yellow"><div class="value">${rate}/min</div><div class="label">Speed</div></div>
    <div class="card"><div class="value">${disk.files.toLocaleString()}</div><div class="label">Files</div></div>
    <div class="card"><div class="value">${disk.size}</div><div class="label">Disk</div></div>
    <div class="card"><div class="value">${eta > 0 ? eta + 'm' : '-'}</div><div class="label">ETA</div></div>
  </div>
  <div class="progress-wrap">
    <div style="display:flex;justify-content:space-between"><span>Progress</span><span style="font-weight:700;color:#22c55e">${pct}%</span></div>
    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%">${pct > 5 ? pct + '%' : ''}</div></div>
  </div>
  <div class="actions">
    ${!running ? `<a href="?action=${startAction}&token=${token}" class="btn btn-green">Start</a>` : ''}
    ${!running ? `<a href="?action=${resumeAction}&token=${token}" class="btn btn-blue">Resume</a>` : ''}
    ${running ? `<a href="?action=${stopAction}&token=${token}" class="btn btn-red">Stop</a>` : ''}
  </div>
  ${recentErrors.length > 0 ? `<div class="section"><h2>Recent Errors (${errors.length} total)</h2><table><tr><th>SKU</th><th>Error</th></tr>${recentErrors.map(e => `<tr><td>${e.sku}</td><td style="color:#ef4444">${e.error}</td></tr>`).join('')}</table></div>` : ''}
  <div class="section"><h2>Log</h2><div class="log">${log || 'No log output.'}</div></div>
</div>`;
}

function renderPage(authenticated, action) {
  const status = getStatus();
  const running = isRunning();
  const disk = getDiskUsage();
  const errors = getErrors();
  const recentErrors = errors.slice(-10).reverse();
  const log = getRecentLog(20);

  const pct = status ? ((status.downloaded / Math.max(status.total, 1)) * 100).toFixed(1) : 0;
  const elapsed = status && status.startedAt ? Math.round((Date.now() - status.startedAt) / 60000) : 0;
  const rate = elapsed > 0 && status ? Math.round(status.downloaded / elapsed) : 0;
  const eta = rate > 0 && status ? Math.round((status.total - status.downloaded - status.skipped) / rate) : 0;

  if (!authenticated) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Grainger Dashboard - Login</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh}
.login{background:#1e293b;padding:40px;border-radius:16px;width:340px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
h1{color:#22c55e;font-size:20px;margin-bottom:8px}p{color:#94a3b8;font-size:13px;margin-bottom:24px}
input{width:100%;padding:12px 16px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#fff;font-size:15px;margin-bottom:16px}
input:focus{outline:none;border-color:#22c55e}
button{width:100%;padding:12px;background:#22c55e;color:#000;font-weight:600;border:none;border-radius:8px;cursor:pointer;font-size:15px}
button:hover{background:#16a34a}.err{color:#ef4444;font-size:13px;margin-bottom:12px}</style></head>
<body><div class="login"><h1>Grainger Dashboard</h1><p>Image download monitor</p>
${action === 'wrong' ? '<div class="err">Wrong password</div>' : ''}
<form method="POST"><input type="password" name="password" placeholder="Password" autofocus>
<button type="submit">Login</button></form></div></body></html>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Grainger Download Dashboard</title>
<meta http-equiv="refresh" content="10">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:20px}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}
h1{font-size:22px;color:#22c55e}
.badge{padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600}
.running{background:#22c55e20;color:#22c55e;border:1px solid #22c55e40}
.stopped{background:#ef444420;color:#ef4444;border:1px solid #ef444440}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px}
.card{background:#1e293b;padding:20px;border-radius:12px;border:1px solid #334155}
.card .value{font-size:28px;font-weight:700;color:#fff;margin-bottom:4px}
.card .label{font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px}
.card.green .value{color:#22c55e}
.card.red .value{color:#ef4444}
.card.blue .value{color:#3b82f6}
.card.yellow .value{color:#eab308}
.progress-wrap{background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #334155}
.progress-bar{height:24px;background:#334155;border-radius:12px;overflow:hidden;margin-top:12px}
.progress-fill{height:100%;background:linear-gradient(90deg,#22c55e,#16a34a);border-radius:12px;transition:width .5s;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#000}
.actions{display:flex;gap:8px;margin-bottom:24px}
.btn{padding:10px 20px;border-radius:8px;border:none;font-weight:600;cursor:pointer;font-size:14px;text-decoration:none;display:inline-block}
.btn-green{background:#22c55e;color:#000}.btn-green:hover{background:#16a34a}
.btn-red{background:#ef4444;color:#fff}.btn-red:hover{background:#dc2626}
.btn-blue{background:#3b82f6;color:#fff}.btn-blue:hover{background:#2563eb}
.btn-gray{background:#475569;color:#fff}.btn-gray:hover{background:#64748b}
.section{background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #334155}
.section h2{font-size:16px;margin-bottom:12px;color:#94a3b8}
table{width:100%;border-collapse:collapse}
td,th{padding:8px 12px;text-align:left;font-size:13px;border-bottom:1px solid #334155}
th{color:#94a3b8;font-size:11px;text-transform:uppercase}
.log{background:#0f172a;padding:16px;border-radius:8px;font-family:'SF Mono',Monaco,monospace;font-size:12px;line-height:1.6;max-height:300px;overflow-y:auto;white-space:pre-wrap;color:#94a3b8}
.warn{color:#eab308;font-weight:600;padding:12px;background:#eab30810;border-radius:8px;margin-bottom:16px;border:1px solid #eab30830}
</style></head>
<body>
<div class="header">
  <h1>Grainger Image Downloader</h1>
  <span class="badge ${running ? 'running' : 'stopped'}">${running ? 'RUNNING' : 'STOPPED'}</span>
</div>

${status && status.banned ? '<div class="warn">WARNING: Possible IP ban detected! The downloader will auto-retry after cooldown.</div>' : ''}
${action === 'started' ? '<div class="warn" style="color:#22c55e;background:#22c55e10;border-color:#22c55e30">Download started!</div>' : ''}
${action === 'stopped' ? '<div class="warn" style="color:#ef4444;background:#ef444410;border-color:#ef444430">Download stopped.</div>' : ''}

<div class="grid">
  <div class="card green"><div class="value">${status ? status.downloaded.toLocaleString() : 0}</div><div class="label">Downloaded</div></div>
  <div class="card blue"><div class="value">${status ? status.total.toLocaleString() : 0}</div><div class="label">Total</div></div>
  <div class="card"><div class="value">${status ? status.skipped.toLocaleString() : 0}</div><div class="label">Skipped</div></div>
  <div class="card red"><div class="value">${status ? status.errors : 0}</div><div class="label">Errors</div></div>
  <div class="card yellow"><div class="value">${rate}/min</div><div class="label">Speed</div></div>
  <div class="card"><div class="value">${disk.files.toLocaleString()}</div><div class="label">Files on Disk</div></div>
  <div class="card"><div class="value">${disk.size}</div><div class="label">Disk Used</div></div>
  <div class="card"><div class="value">${eta > 0 ? eta + 'm' : '-'}</div><div class="label">ETA</div></div>
</div>

<div class="progress-wrap">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <span>Progress</span>
    <span style="font-size:14px;font-weight:700;color:#22c55e">${pct}%</span>
  </div>
  <div class="progress-bar">
    <div class="progress-fill" style="width:${pct}%">${pct > 5 ? pct + '%' : ''}</div>
  </div>
</div>

<div class="actions">
  ${!running ? `<a href="?action=start&token=${PASSWORD}" class="btn btn-green">Start Download</a>` : ''}
  ${!running ? `<a href="?action=resume&token=${PASSWORD}" class="btn btn-blue">Resume Download</a>` : ''}
  ${running ? `<a href="?action=stop&token=${PASSWORD}" class="btn btn-red">Stop Download</a>` : ''}
  <a href="?token=${PASSWORD}" class="btn btn-gray">Refresh</a>
</div>

${recentErrors.length > 0 ? `
<div class="section">
  <h2>Recent Errors (${errors.length} total)</h2>
  <table>
    <tr><th>Time</th><th>SKU</th><th>Error</th></tr>
    ${recentErrors.map(e => `<tr><td>${new Date(e.time).toLocaleTimeString()}</td><td>${e.sku}</td><td style="color:#ef4444">${e.error}</td></tr>`).join('')}
  </table>
</div>` : ''}

<div class="section">
  <h2>Recent Log</h2>
  <div class="log">${log || 'No log output yet. Start a download to see logs.'}</div>
</div>

<hr style="border-color:#334155;margin:32px 0">

${renderPanel('HQ Images (Original Quality)', HQ_STATUS_FILE, HQ_ERROR_FILE, HQ_PID_FILE, HQ_LOG_FILE, HQ_IMAGE_DIR, 'start-hq', 'resume-hq', 'stop-hq', PASSWORD)}

<div style="text-align:center;color:#475569;font-size:12px;margin-top:20px">
  Auto-refreshes every 10 seconds &bull; <a href="/" style="color:#64748b">Logout</a>
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
  if (action === 'start' || action === 'resume') {
    const mode = action === 'resume' ? 'resume' : 'start';
    const child = spawn('node', [SCRIPT_PATH, mode], {
      cwd: process.cwd(),
      detached: true,
      stdio: ['ignore', fs.openSync(LOG_FILE, 'a'), fs.openSync(LOG_FILE, 'a')],
    });
    child.unref();
    res.writeHead(302, { Location: `/?token=${PASSWORD}&action=started` });
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

  // HQ actions
  if (action === 'start-hq' || action === 'resume-hq') {
    const mode = action === 'resume-hq' ? 'resume' : 'start';
    const child = spawn('node', [HQ_SCRIPT_PATH, mode], {
      cwd: process.cwd(),
      detached: true,
      stdio: ['ignore', fs.openSync(HQ_LOG_FILE, 'a'), fs.openSync(HQ_LOG_FILE, 'a')],
    });
    child.unref();
    res.writeHead(302, { Location: `/?token=${PASSWORD}&action=started` });
    res.end();
    return;
  }

  if (action === 'stop-hq') {
    try {
      if (fs.existsSync(HQ_PID_FILE)) {
        const pid = parseInt(fs.readFileSync(HQ_PID_FILE, 'utf8').trim());
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
  console.log(`\n  Grainger Dashboard running at http://0.0.0.0:${PORT}\n  Password: ${PASSWORD}\n`);
});
