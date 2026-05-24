import fs from 'node:fs';

const INPUT = 'data/processed/outdoor_routes_v11.json';
const OUTPUT = 'data/processed/outdoor_routes_v12.json';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n');

const CONF = new Set(['A', 'B', 'C', 'D']);

function parseAlt(v) {
  if (Number.isFinite(v)) return v;
  if (!v) return null;
  const m = String(v).match(/(\d{3,5})/);
  if (!m) return null;
  return Number(m[1]);
}

function normalizeRoute(r) {
  const out = { ...r };

  if (!CONF.has(out.geometry_confidence)) {
    if (out.track_truth_v7?.grade === 'real_track') out.geometry_confidence = 'A';
    else if (out.track_truth_v7?.grade === 'source_track' || out.track_truth_v7?.grade === 'road_navigation') out.geometry_confidence = 'B';
    else if ((out.track_points || []).length > 1) out.geometry_confidence = 'C';
    else out.geometry_confidence = 'D';
  }

  if (!out.start_poi) {
    out.start_poi = out.ops?.start_poi || out.navigation?.start || out.key_altitude_points?.start || out.nearest_city || '起点待核验';
  }
  if (!out.end_poi) {
    out.end_poi = out.ops?.end_poi || out.navigation?.end || out.key_altitude_points?.end || out.start_poi || '终点待核验';
  }
  if (!Number.isFinite(out.max_altitude_m) || out.max_altitude_m <= 0) {
    const candidate = parseAlt(out.key_altitude_points?.max) || parseAlt(out.elevation_profile) || parseAlt(out.max_altitude_note);
    if (candidate) out.max_altitude_m = candidate;
  }
  if (!out.region_text && out.region_scope === 'domestic') {
    out.region_text = out.nearest_city ? `${out.nearest_city} · 国内主线` : '国内主线';
  }
  if (!out.region_text && out.region_scope === 'global') {
    out.region_text = out.country_or_region ? `${out.country_or_region} · 国外精选` : '国外精选';
  }

  if (!out.resupply_points) out.resupply_points = [];
  if (!out.retreat_points) out.retreat_points = [];
  if (!out.risk_tags) out.risk_tags = [];
  if (!out.aliases) out.aliases = [];

  return out;
}

function main() {
  const base = read(INPUT);
  const routes = (base.routes || []).map(normalizeRoute);
  const fixedGeometry = routes.filter(r => CONF.has(r.geometry_confidence)).length;

  const out = {
    ...base,
    version: 'v12',
    generated_at: new Date().toISOString(),
    generated_from: [...(base.generated_from || []), INPUT],
    routes,
    v12_review: {
      principle: '仅做质量规范化，不新增低可信路线：补齐字段、统一置信度口径、修复关键空值。',
      normalized_geometry_confidence: fixedGeometry,
      source: INPUT
    },
    merge_report: {
      ...(base.merge_report || {}),
      version: 'v12',
      route_count: routes.length,
      geometry_confidence_A: routes.filter(r => r.geometry_confidence === 'A').length,
      geometry_confidence_B: routes.filter(r => r.geometry_confidence === 'B').length,
      geometry_confidence_C: routes.filter(r => r.geometry_confidence === 'C').length,
      geometry_confidence_D: routes.filter(r => r.geometry_confidence === 'D').length
    }
  };

  write(OUTPUT, out);
  console.log(JSON.stringify({
    version: out.version,
    route_count: out.routes.length,
    geometry_counts: {
      A: out.merge_report.geometry_confidence_A,
      B: out.merge_report.geometry_confidence_B,
      C: out.merge_report.geometry_confidence_C,
      D: out.merge_report.geometry_confidence_D
    }
  }, null, 2));
}

main();
