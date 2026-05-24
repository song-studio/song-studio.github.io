import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = 'data/processed/qa';
const now = new Date().toISOString();

function run(label, script, args = []) {
  const r = spawnSync('node', [script, ...args], { encoding: 'utf8' });
  const ok = r.status === 0;
  return {
    label,
    script,
    ok,
    status: r.status,
    stdout: r.stdout?.trim() || '',
    stderr: r.stderr?.trim() || ''
  };
}

function parseLatestJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const runs = [
    run('outdoor-routes', 'scripts/qa-outdoor-routes.mjs'),
    run('weather-console', 'scripts/qa-weather-console.mjs'),
    run('track-links', 'scripts/qa-track-links.mjs')
  ];

  const routeLatest = parseLatestJson(path.join(OUT_DIR, 'outdoor-routes-qa-latest.json'));
  const weatherLatest = parseLatestJson(path.join(OUT_DIR, 'weather-console-qa-latest.json'));
  const trackLinksLatest = parseLatestJson(path.join(OUT_DIR, 'track-links-qa-latest.json'));

  const allPass = runs.every(r => r.ok);
  const summary = {
    generated_at: now,
    all_pass: allPass,
    runs: runs.map(r => ({
      label: r.label,
      ok: r.ok,
      status: r.status
    })),
    route_gate: routeLatest?.gate || null,
    weather_gate: weatherLatest?.gate || null,
    track_links_gate: trackLinksLatest || null,
    route_summary: routeLatest?.summary || null,
    weather_summary: weatherLatest?.summary || null
  };

  fs.writeFileSync(path.join(OUT_DIR, 'data-qa-summary-latest.json'), JSON.stringify(summary, null, 2) + '\n');

  const lines = [
    '# Data QA Summary',
    '',
    `- generated_at: ${now}`,
    `- all_pass: **${allPass ? 'PASS' : 'FAIL'}**`,
    '',
    '## Jobs',
    '',
    ...runs.map(r => `- ${r.label}: ${r.ok ? 'PASS' : 'FAIL'} (status=${r.status})`),
    ''
  ];
  fs.writeFileSync(path.join(OUT_DIR, 'data-qa-summary-latest.md'), lines.join('\n'));

  console.log(JSON.stringify({
    qa: 'all',
    all_pass: allPass,
    jobs: runs.map(r => ({ label: r.label, ok: r.ok, status: r.status }))
  }, null, 2));

  if (!allPass) {
    for (const r of runs) {
      if (!r.ok) {
        console.error(`\n[${r.label}] stdout:\n${r.stdout}`);
        if (r.stderr) console.error(`\n[${r.label}] stderr:\n${r.stderr}`);
      }
    }
    process.exit(2);
  }
}

main();
