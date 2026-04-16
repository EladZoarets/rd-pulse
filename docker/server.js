'use strict';

const express = require('express');
const { spawn } = require('child_process');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const REPORTS_DIR = '/reports';
const PORT = process.env.PORT || 3000;
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 8 * * 1-5'; // 8 AM weekdays Mon-Fri

const REQUIRED_VARS = [
  'GITHUB_TOKEN', 'OPENAI_API_KEY',
  'JIRA_DOMAIN', 'JIRA_EMAIL', 'JIRA_TOKEN',
  'GITHUB_OWNER', 'GITHUB_REPO', 'JIRA_BOARD',
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`[rd-pulse] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
}

function getReports() {
  if (!fs.existsSync(REPORTS_DIR)) return [];
  return fs.readdirSync(REPORTS_DIR)
    .filter((f) => f.endsWith('.html'))
    .sort()
    .reverse()
    .map((filename) => {
      const stat = fs.statSync(path.join(REPORTS_DIR, filename));
      return { filename, url: `/report/${filename}`, createdAt: stat.mtime.toISOString() };
    });
}

let isRunning = false;
let lastError = null;
let lastRun = null;
let lastRepo = null;

function runConnector(overrides, callback) {
  if (isRunning) return callback(new Error('Already running'));
  isRunning = true;
  lastError = null;

  const owner = overrides.owner || process.env.GITHUB_OWNER;
  const repo  = overrides.repo  || process.env.GITHUB_REPO;
  const board = overrides.board || process.env.JIRA_BOARD;
  const days  = String(overrides.days  || process.env.DAYS || '1');

  lastRepo = repo;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `report-${timestamp}.html`;
  const outputPath = path.join(REPORTS_DIR, filename);

  const args = [
    'pulse',
    '--owner', owner,
    '--repo',  repo,
    '--board', board,
    '--format', 'html',
    '--output', outputPath,
    '--days', days,
  ];

  if (process.env.MODEL) args.push('--model', process.env.MODEL);

  console.log(`[${new Date().toISOString()}] Starting report generation (${owner}/${repo})…`);

  const proc = spawn('rdpulse-connector', args, {
    env: process.env,
    timeout: 180_000,
  });

  proc.stdout.on('data', (d) => process.stdout.write(d));
  proc.stderr.on('data', (d) => process.stderr.write(d));

  proc.on('close', (code) => {
    isRunning = false;
    lastRun = new Date().toISOString();
    if (code !== 0) {
      lastError = `Connector exited with code ${code}`;
      console.error(`[rd-pulse] ${lastError}`);
      return callback(new Error(lastError));
    }
    console.log(`[${new Date().toISOString()}] Report ready: ${filename}`);
    callback(null, filename);
  });
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/status', (_req, res) => {
  res.json({ isRunning, lastRun, lastError, lastRepo, cron: CRON_SCHEDULE, reports: getReports() });
});

app.post('/api/run', (req, res) => {
  if (isRunning) return res.status(409).json({ error: 'Report generation already in progress' });
  const overrides = req.body || {};
  // Respond immediately — client polls /api/status for completion
  res.json({ started: true });
  runConnector(overrides, () => {});
});

app.get('/report/:filename', (req, res) => {
  const safe = path.basename(req.params.filename);
  const filepath = path.join(REPORTS_DIR, safe);
  if (!safe.endsWith('.html') || !fs.existsSync(filepath)) {
    return res.status(404).send('Report not found');
  }
  res.sendFile(filepath);
});

// ── Boot ──────────────────────────────────────────────────────────────────────

validateEnv();
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

cron.schedule(CRON_SCHEDULE, () => {
  console.log(`[rd-pulse] Cron triggered (${CRON_SCHEDULE})`);
  runConnector({}, () => {});
});

app.listen(PORT, () => {
  console.log(`[rd-pulse] Dashboard → http://localhost:${PORT}`);
  console.log(`[rd-pulse] Cron: ${CRON_SCHEDULE}`);
});
