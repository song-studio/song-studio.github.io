#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IN_FILE = path.join(ROOT, 'data/processed/outdoor_routes_v12.json');
const OUT_FILE = path.join(ROOT, 'data/processed/outdoor_routes_v13.json');
const QA_DIR = path.join(ROOT, 'data/processed/qa');
const TS = new Date().toISOString();

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n'); }
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

function pickUrl(route) {
  return route?.track_truth_v7?.public_track_url || route?.gpx_url || '';
}

function classify(code, err = '') {
  if (!Number.isFinite(code)) {
    if (err.includes('timeout') || err.includes('aborted')) return 'error';
    return 'error';
  }
  if (code >= 200 && code < 300) return 'ok';
  if ([401,403,405,406,409,412,418,423,429,451].includes(code)) return 'blocked';
  if ([404,410].includes(code)) return 'broken';
  if (code >= 500) return 'blocked';
  return 'error';
}

async function probe(url) {
  if (!url || !/^https?:\/\//i.test(url)) {
    return { status: 'unknown', http_code: null, final_url: '', reason: 'missing_or_invalid_url' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    // Some sources block HEAD; GET with small headers is more reliable.
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; SongStudioRouteBot/1.0)',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    clearTimeout(timer);
    const status = classify(res.status);
    return {
      status,
      http_code: res.status,
      final_url: res.url || url,
      reason: status === 'ok' ? 'reachable' : `http_${res.status}`
    };
  } catch (e) {
    clearTimeout(timer);
    const reason = String(e?.message || e || 'request_error');
    return { status: classify(NaN, reason), http_code: null, final_url: url, reason };
  }
}

async function runPool(items, worker, concurrency = 8) {
  const out = new Array(items.length);
  let idx = 0;
  async function next() {
    while (true) {
      const i = idx++;
      if (i >= items.length) return;
      out[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => next()));
  return out;
}

const source = readJson(IN_FILE);
const routes = Array.isArray(source.routes) ? source.routes : [];

const checked = await runPool(routes, async (route) => {
  const url = pickUrl(route);
  const result = await probe(url);
  return { route, url, result };
}, 8);

const counters = { ok: 0, blocked: 0, broken: 0, error: 0, unknown: 0 };
const patchedRoutes = checked.map(({ route, url, result }) => {
  counters[result.status] = (counters[result.status] || 0) + 1;

  const next = { ...route };
  const existing = next.track_link_v10 || {};
  next.track_link_v10 = {
    ...existing,
    link_access_status: result.status,
    link_access_http_code: result.http_code,
    link_access_checked_at: TS,
    link_access_reason: result.reason,
    link_access_url: url || ''
  };

  // Keep UI behavior safe: broken links are hidden from direct jump button.
  if (result.status === 'broken') {
    if (next.track_truth_v7 && next.track_truth_v7.public_track_url) {
      next.track_truth_v7 = {
        ...next.track_truth_v7,
        public_track_url: ''
      };
    }
  }
  return next;
});

const outData = {
  ...source,
  version: 'outdoor_routes_v13',
  generated_at: TS,
  merged_from: [...new Set([...(source.merged_from || []), 'scripts/audit-track-links.mjs'])],
  merge_report: {
    ...(source.merge_report || {}),
    track_link_audit_v13: {
      checked_at: TS,
      total_routes: routes.length,
      total_with_url: checked.filter(x => x.url).length,
      status_counts: counters
    }
  },
  routes: patchedRoutes
};

ensureDir(QA_DIR);
writeJson(OUT_FILE, outData);

const auditList = checked.map(({ route, url, result }) => ({
  route_id: route.route_id,
  name_zh: route.name_zh,
  mode: route.mode,
  region_scope: route.region_scope,
  url,
  status: result.status,
  http_code: result.http_code,
  reason: result.reason
}));

writeJson(path.join(QA_DIR, 'track-links-audit-latest.json'), {
  generated_at: TS,
  input: path.relative(ROOT, IN_FILE),
  output: path.relative(ROOT, OUT_FILE),
  total_routes: routes.length,
  total_with_url: auditList.filter(x => x.url).length,
  status_counts: counters,
  bad_links: auditList.filter(x => x.status === 'broken' || x.status === 'error')
});

const md = [
  '# 轨迹链接探活报告（最新）',
  '',
  `- 生成时间：${TS}`,
  `- 检查总线路：${routes.length}`,
  `- 含链接线路：${auditList.filter(x => x.url).length}`,
  `- 可用：${counters.ok}`,
  `- 受限（WAF/权限/频控）：${counters.blocked}`,
  `- 失效（404/410）：${counters.broken}`,
  `- 异常（超时/网络）：${counters.error}`,
  `- 无链接：${counters.unknown}`,
  '',
  '## 需处理条目（失效/异常）',
  '',
  ...auditList
    .filter(x => x.status === 'broken' || x.status === 'error')
    .slice(0, 80)
    .map(x => `- ${x.route_id} | ${x.name_zh} | ${x.status}${x.http_code ? `(${x.http_code})` : ''} | ${x.url || '无链接'}`)
];
fs.writeFileSync(path.join(QA_DIR, 'track-links-audit-latest.md'), md.join('\n') + '\n');

console.log(JSON.stringify({ ok: true, version: outData.version, counters }, null, 2));
