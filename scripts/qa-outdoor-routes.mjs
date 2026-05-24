import fs from 'node:fs';
import path from 'node:path';

const INPUT = process.argv[2] || 'data/processed/outdoor_routes_v12.json';
const OUT_DIR = 'data/processed/qa';

const MODES = new Set(['hiking', 'cycling', 'motorcycle', 'mountaineering']);
const CONF = new Set(['A', 'B', 'C', 'D']);

const WEIGHTS_COMMON = [
  ['name_zh', 2],
  ['mode', 2],
  ['start_poi', 2],
  ['end_poi', 2],
  ['distance_km', 2],
  ['elevation_gain_m', 1.5],
  ['max_altitude_m', 1.5],
  ['risk_tags', 1.5],
  ['season_status', 1],
  ['access_status', 1],
  ['confidence_grade', 1.5],
  ['geometry_confidence', 1.5],
  ['track_truth_v7', 2]
];

const WEIGHTS_MODE = {
  hiking: [
    ['water_points', 1.5],
    ['retreat_points', 1.5],
    ['gear_essential', 1]
  ],
  cycling: [
    ['cycling_ops', 2],
    ['cycling_poi', 1.5],
    ['signal_coverage', 1]
  ],
  motorcycle: [
    ['cycling_ops', 2],
    ['resupply_points', 1],
    ['signal_coverage', 1]
  ],
  mountaineering: [
    ['mountaineering', 2],
    ['mountaineering_geo', 1.5],
    ['permit_required', 1]
  ]
};

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const safeReadJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n');

function hasValue(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim().length > 0 && !v.includes('待核验');
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'boolean') return true;
  return false;
}

function modeWeights(mode) {
  return WEIGHTS_MODE[mode] || [];
}

function completenessScore(route) {
  const pairs = [...WEIGHTS_COMMON, ...modeWeights(route.mode)];
  let totalWeight = 0;
  let hitWeight = 0;
  for (const [field, weight] of pairs) {
    totalWeight += weight;
    if (hasValue(route[field])) hitWeight += weight;
  }
  return totalWeight > 0 ? hitWeight / totalWeight : 0;
}

function routeIssues(route) {
  const issues = [];
  if (!hasValue(route.route_id)) issues.push('缺少 route_id');
  if (!hasValue(route.name_zh)) issues.push('缺少 name_zh');
  if (!MODES.has(route.mode)) issues.push(`mode 非法: ${route.mode}`);
  if (!hasValue(route.start_poi) || !hasValue(route.end_poi)) issues.push('缺少起终点');
  if (!(Number.isFinite(route.distance_km) && route.distance_km > 0)) issues.push('distance_km 无效');
  if (!(Number.isFinite(route.max_altitude_m) && route.max_altitude_m > 0)) issues.push('max_altitude_m 无效');
  if (!CONF.has(route.confidence_grade)) issues.push(`confidence_grade 非法: ${route.confidence_grade}`);
  if (!CONF.has(route.geometry_confidence)) issues.push(`geometry_confidence 非法: ${route.geometry_confidence}`);

  const truth = route.track_truth_v7 || {};
  if (!hasValue(truth.grade)) issues.push('缺少 track_truth_v7.grade');
  if (truth.can_navigate === true && !hasValue(truth.public_track_url) && truth.grade !== 'road_navigation') {
    issues.push('可导航但缺少 public_track_url');
  }
  if (truth.grade === 'real_track' && !hasValue(truth.public_track_url)) {
    issues.push('real_track 缺少 public_track_url');
  }
  if (truth.grade === 'banned' && truth.can_navigate === true) {
    issues.push('banned 不应可导航');
  }
  return issues;
}

function summarize(routes) {
  const byMode = {};
  const byScope = {};
  const gapCounter = {};
  const critical = [];
  let sum = 0;

  const dupMap = new Map();
  for (const r of routes) {
    byMode[r.mode] = (byMode[r.mode] || 0) + 1;
    byScope[r.region_scope || 'unknown'] = (byScope[r.region_scope || 'unknown'] || 0) + 1;
    const score = completenessScore(r);
    sum += score;
    const issues = routeIssues(r);
    if (score < 0.66 || issues.length > 0) {
      critical.push({
        route_id: r.route_id,
        name_zh: r.name_zh,
        score: Number(score.toFixed(3)),
        issues
      });
    }
    for (const i of issues) gapCounter[i] = (gapCounter[i] || 0) + 1;
    const dupKey = `${String(r.name_zh || '').trim()}|${String(r.start_poi || '').trim()}|${String(r.end_poi || '').trim()}`;
    if (!dupMap.has(dupKey)) dupMap.set(dupKey, []);
    dupMap.get(dupKey).push(r.route_id || '(missing)');
  }

  const duplicates = [...dupMap.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([k, ids]) => ({ key: k, route_ids: ids }));

  const avg = routes.length ? sum / routes.length : 0;
  const gradeA = routes.filter(r => r.confidence_grade === 'A').length;
  const navigable = routes.filter(r => r.track_truth_v7?.can_navigate === true).length;
  const publicTracks = routes.filter(r => hasValue(r.track_truth_v7?.public_track_url)).length;

  return {
    total_routes: routes.length,
    by_mode: byMode,
    by_scope: byScope,
    average_completeness: Number(avg.toFixed(4)),
    confidence_A_count: gradeA,
    navigable_count: navigable,
    public_track_count: publicTracks,
    duplicate_name_start_end: duplicates,
    top_gaps: Object.entries(gapCounter).sort((a, b) => b[1] - a[1]).slice(0, 20),
    critical_routes: critical.sort((a, b) => a.score - b.score).slice(0, 80)
  };
}

function passFail(summary) {
  const failures = [];
  if (summary.total_routes < 100) failures.push('路线总数 < 100');
  if (summary.average_completeness < 0.78) failures.push(`平均完整度过低: ${summary.average_completeness}`);
  if ((summary.by_mode.hiking || 0) < 30) failures.push('徒步路线不足 30');
  if ((summary.by_mode.cycling || 0) < 15) failures.push('骑行路线不足 15');
  if ((summary.by_mode.mountaineering || 0) < 10) failures.push('登山路线不足 10');
  if (summary.duplicate_name_start_end.length > 0) failures.push(`存在重复线路组: ${summary.duplicate_name_start_end.length}`);
  return { pass: failures.length === 0, failures };
}

function markdown(summary, gate, sourceFile) {
  const topGaps = summary.top_gaps.map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- 无';
  const critical = summary.critical_routes.slice(0, 20).map(r => `- ${r.name_zh || r.route_id} | score=${r.score} | ${r.issues.join('；')}`).join('\n') || '- 无';
  const dups = summary.duplicate_name_start_end.slice(0, 10).map(d => `- ${d.key} => ${d.route_ids.join(', ')}`).join('\n') || '- 无';
  return [
    '# Outdoor Routes QA',
    '',
    `- source: \`${sourceFile}\``,
    `- total_routes: **${summary.total_routes}**`,
    `- avg_completeness: **${summary.average_completeness}**`,
    `- gate: **${gate.pass ? 'PASS' : 'FAIL'}**`,
    '',
    '## Coverage',
    '',
    `- by_mode: ${JSON.stringify(summary.by_mode)}`,
    `- by_scope: ${JSON.stringify(summary.by_scope)}`,
    `- confidence_A_count: ${summary.confidence_A_count}`,
    `- navigable_count: ${summary.navigable_count}`,
    `- public_track_count: ${summary.public_track_count}`,
    '',
    '## Gate Failures',
    '',
    ...(gate.failures.length ? gate.failures.map(x => `- ${x}`) : ['- 无']),
    '',
    '## Top Gaps',
    '',
    topGaps,
    '',
    '## Duplicate Candidates',
    '',
    dups,
    '',
    '## Lowest Quality Routes',
    '',
    critical,
    ''
  ].join('\n');
}

function main() {
  const data = safeReadJson(INPUT);
  const routes = data.routes || [];
  const summary = summarize(routes);
  const gate = passFail(summary);

  ensureDir(OUT_DIR);
  const payload = {
    generated_at: new Date().toISOString(),
    source_file: INPUT,
    summary,
    gate
  };
  writeJson(path.join(OUT_DIR, 'outdoor-routes-qa-latest.json'), payload);
  fs.writeFileSync(path.join(OUT_DIR, 'outdoor-routes-qa-latest.md'), markdown(summary, gate, INPUT));
  console.log(JSON.stringify({
    qa: 'outdoor-routes',
    pass: gate.pass,
    failures: gate.failures,
    avg: summary.average_completeness,
    total: summary.total_routes
  }, null, 2));
  if (!gate.pass) process.exit(2);
}

main();
