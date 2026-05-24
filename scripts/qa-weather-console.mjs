import fs from 'node:fs';
import path from 'node:path';

const INPUT = process.argv[2] || 'data/processed/weather_console_v7.json';
const OUT_DIR = 'data/processed/qa';

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n');

const hasNum = (v) => Number.isFinite(v);
const hasStr = (v) => typeof v === 'string' && v.trim().length > 0;

function summarize(data) {
  const metrics = data.metrics || [];
  const rules = data.rules || [];
  const sources = data.sources || [];
  const geocode = data.geocode_fallbacks || [];
  const modules = data.decision_modules || [];
  const thunderstorm = data.thunderstorm || {};
  const apiLive = Array.isArray(data.api_live_test)
    ? data.api_live_test
    : Array.isArray(data.api_live_test?.samples)
      ? data.api_live_test.samples
      : Array.isArray(data.api_live_test?.results)
        ? data.api_live_test.results
        : [];

  const geocodeMissingCoord = geocode.filter(x => !hasNum(x.manual_lat) || !hasNum(x.manual_lng)).length;
  const geocodeMissingName = geocode.filter(x => !hasStr(x.query_zh) && !hasStr(x.display_name)).length;
  const geocodeNeedReview = geocode.filter(x => x.needs_manual_review === true).length;

  const thresholds = thunderstorm?.cape_thresholds
    || thunderstorm?.thresholds
    || thunderstorm?.threshold_system?.thresholds
    || [];
  const thresholdCount = Array.isArray(thresholds) ? thresholds.length : Object.keys(thresholds).length;
  const hasThunderThresholds = thresholdCount >= 3;

  return {
    metrics_count: metrics.length,
    rules_count: rules.length,
    sources_count: sources.length,
    geocode_count: geocode.length,
    decision_module_count: modules.length,
    api_live_count: apiLive.length,
    geocode_missing_coord: geocodeMissingCoord,
    geocode_missing_name: geocodeMissingName,
    geocode_need_manual_review: geocodeNeedReview,
    thunderstorm_threshold_keys: Array.isArray(thresholds) ? thresholds.map(t => t.level || t.label || '(unnamed)') : Object.keys(thresholds),
    has_thunderstorm_thresholds: hasThunderThresholds
  };
}

function gate(summary) {
  const failures = [];
  if (summary.metrics_count < 20) failures.push('metrics_count < 20');
  if (summary.rules_count < 60) failures.push('rules_count < 60');
  if (summary.sources_count < 12) failures.push('sources_count < 12');
  if (summary.geocode_count < 100) failures.push('geocode_count < 100');
  if (summary.decision_module_count < 8) failures.push('decision_module_count < 8');
  if (summary.api_live_count < 5) failures.push('api_live_count < 5');
  if (summary.geocode_missing_name > 0) failures.push(`存在缺名地理记录: ${summary.geocode_missing_name}`);
  if (!summary.has_thunderstorm_thresholds) failures.push('缺少雷暴阈值配置');
  return { pass: failures.length === 0, failures };
}

function markdown(summary, g, sourceFile) {
  return [
    '# Weather Console QA',
    '',
    `- source: \`${sourceFile}\``,
    `- gate: **${g.pass ? 'PASS' : 'FAIL'}**`,
    '',
    '## Counts',
    '',
    `- metrics: ${summary.metrics_count}`,
    `- rules: ${summary.rules_count}`,
    `- sources: ${summary.sources_count}`,
    `- geocode_fallbacks: ${summary.geocode_count}`,
    `- decision_modules: ${summary.decision_module_count}`,
    `- api_live_test: ${summary.api_live_count}`,
    '',
    '## Geocode Quality',
    '',
    `- missing_coord: ${summary.geocode_missing_coord}`,
    `- missing_name: ${summary.geocode_missing_name}`,
    `- needs_manual_review: ${summary.geocode_need_manual_review}`,
    '',
    '## Thunderstorm Thresholds',
    '',
    `- keys: ${summary.thunderstorm_threshold_keys.join(', ') || '(none)'}`,
    '',
    '## Gate Failures',
    '',
    ...(g.failures.length ? g.failures.map(x => `- ${x}`) : ['- 无']),
    ''
  ].join('\n');
}

function main() {
  const data = readJson(INPUT);
  const summary = summarize(data);
  const g = gate(summary);
  const payload = {
    generated_at: new Date().toISOString(),
    source_file: INPUT,
    summary,
    gate: g
  };

  ensureDir(OUT_DIR);
  writeJson(path.join(OUT_DIR, 'weather-console-qa-latest.json'), payload);
  fs.writeFileSync(path.join(OUT_DIR, 'weather-console-qa-latest.md'), markdown(summary, g, INPUT));

  console.log(JSON.stringify({
    qa: 'weather-console',
    pass: g.pass,
    failures: g.failures,
    metrics: summary.metrics_count,
    geocode: summary.geocode_count
  }, null, 2));
  if (!g.pass) process.exit(2);
}

main();
