import fs from 'node:fs';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, data) => fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
const norm = (s = '') => String(s).replace(/[\s()（）·・,，、\-]/g, '').toLowerCase();
const uniq = (arr = []) => [...new Set(arr.filter(Boolean).map(x => typeof x === 'string' ? x.trim() : x).filter(Boolean))];
const stripSignal = (s = '') => String(s).replace(/[🟢🔴⚠️⚠✅❌]/gu, '').replace(/\s+/g, ' ').trim();
const cleanList = (arr = []) => uniq(arr.map(stripSignal)).filter(Boolean);
const byName = (arr, key = 'name_zh') => {
  const m = new Map();
  for (const x of arr || []) {
    const k = norm(x[key] || x.display_name || x.name);
    if (k && !m.has(k)) m.set(k, x);
  }
  return m;
};

function routeLevelFromFactors(route, truth) {
  const text = [
    ...(route.hard_stop_rules || []),
    ...(route.go_no_go_factors || []),
    truth?.user_warning_zh || ''
  ].join(' ');
  if (/不可|停止|不冲顶|无信号|极其困难|危险|撤回/.test(text)) return 'red';
  if (/注意|警戒|需|谨慎|核验|窗口/.test(text)) return 'amber';
  return 'green';
}

function routeTrackGrade(r, truth) {
  if (truth?.track_grade_final) return truth.track_grade_final;
  if (r.track_grade) return r.track_grade;
  if (r.track_type === 'gpx_url_only') return 'source_track';
  if (r.track_type === 'key_points') return 'key_points';
  if (r.gpx_url && r.track_points?.length && r.geometry_confidence === 'A') return 'source_track';
  if (r.track_points?.length) return 'key_points';
  return 'unverified';
}

function mergeRoutes() {
  const base = read('data/processed/outdoor_routes_v6.json');
  const decision = read('data/inbox/2026-05-24/nova7-review/route_decision_fields_v7.json');
  const truth = read('data/inbox/2026-05-24/nova7-review/route_track_truth_audit.json');
  const decByName = byName(decision.routes || []);
  const truthByName = byName(truth.routes || []);
  let decisionMatched = 0;
  let truthMatched = 0;

  const routes = (base.routes || []).map(r => {
    const d = decByName.get(norm(r.name_zh));
    const t = truthByName.get(norm(r.name_zh));
    if (d) decisionMatched += 1;
    if (t) truthMatched += 1;
    const trackGrade = routeTrackGrade(r, t);
    const v7Decision = d ? {
      summary: stripSignal(d.decision_summary_zh || ''),
      go_no_go_factors: cleanList(d.go_no_go_factors || []),
      best_window: stripSignal(d.best_window || ''),
      hard_stop_rules: cleanList(d.hard_stop_rules || []),
      permit_level: d.permit_level || '',
      permit_note_zh: stripSignal(d.permit_note_zh || ''),
      rescue_reality_zh: stripSignal(d.rescue_reality_zh || ''),
      signal_reality_zh: stripSignal(d.signal_reality_zh || ''),
      water_reliability: d.water_reliability || '',
      camping_reality_zh: stripSignal(d.camping_reality_zh || ''),
      who_should_avoid_zh: stripSignal(d.who_should_avoid_zh || ''),
      decision_level: routeLevelFromFactors(d, t)
    } : {
      summary: r.region_scope === 'global' ? '海外精选路线，已纳入目录，轨迹与许可需出发前二次核验。' : '',
      go_no_go_factors: r.region_scope === 'global' ? ['先核验当地许可、保险和官方步道状态', '不要用本站示意线替代离线轨迹'] : [],
      best_window: r.best_season || r.season_status || '',
      hard_stop_rules: r.region_scope === 'global' ? ['无官方轨迹或当地封控信息时不出发'] : [],
      permit_level: r.permit_required ? 'review' : '',
      permit_note_zh: r.permit_required ? '许可要求需按目的地官方渠道复核' : '',
      decision_level: r.region_scope === 'global' ? 'amber' : 'green'
    };
    const trackTruth = {
      grade: trackGrade,
      can_navigate: t ? t.can_navigate === true : trackGrade === 'real_track',
      public_track_url: t?.public_track_url || r.gpx_url || '',
      source_name: t?.source_name || (r.gpx_url ? '外部轨迹来源' : ''),
      evidence_note: stripSignal(t?.evidence_note || ''),
      user_warning_zh: stripSignal(t?.user_warning_zh || (trackGrade === 'key_points' ? '关键点示意，不可直接导航' : trackGrade === 'unverified' ? '轨迹待核验，不可直接导航' : '使用前仍需核验实时封控、天气和路况'))
    };
    return {
      ...r,
      track_grade: trackGrade,
      track_truth_v7: trackTruth,
      decision_v7: v7Decision,
      permit_required: r.permit_required ?? (d?.permit_level === 'strict'),
      permit_how: r.permit_how || d?.permit_note_zh || '',
      signal_coverage: r.signal_coverage || d?.signal_reality_zh || '',
      emergency_access_note: r.emergency_access_note || d?.rescue_reality_zh || '',
      v7_reviewed: Boolean(d || t)
    };
  });

  const out = {
    ...base,
    version: 'v7',
    generated_at: new Date().toISOString(),
    generated_from: [
      ...(base.generated_from || []),
      'data/inbox/2026-05-24/nova7-review/route_decision_fields_v7.json',
      'data/inbox/2026-05-24/nova7-review/route_track_truth_audit.json'
    ],
    routes,
    v7_review: {
      product_positioning: '决策翻译层：别人给数据，我们给行动判断、硬停止规则和轨迹真实性提示。',
      priority_real_track_names: truth.priority_30_for_real_track || [],
      caveat: 'Nova7 的 route_id 有重复，生产合并按路线中文名匹配，重复审计表不直接进入页面。'
    },
    merge_report: {
      ...(base.merge_report || {}),
      version: 'v7',
      route_count: routes.length,
      decision_matched_count: decisionMatched,
      track_truth_matched_count: truthMatched,
      global_routes_without_v7_review: routes.filter(r => r.region_scope === 'global' && !r.v7_reviewed).length,
      navigable_track_count: routes.filter(r => r.track_truth_v7?.can_navigate).length,
      key_point_track_count: routes.filter(r => r.track_truth_v7?.grade === 'key_points').length,
      unverified_track_count: routes.filter(r => r.track_truth_v7?.grade === 'unverified').length
    }
  };
  write('data/processed/outdoor_routes_v7.json', out);
  return out.merge_report;
}

function mergeWeather() {
  const base = read('data/processed/weather_console_v6.json');
  const quality = read('data/inbox/2026-05-24/nova7-review/weather_decision_quality_v7.json');
  const modules = read('data/inbox/2026-05-24/nova7-review/weather_modules_v7.json');
  const qByName = byName(quality.locations || [], 'query_zh');
  let matched = 0;
  let coordinateConflictCount = 0;
  const fallbacks = (base.geocode_fallbacks || []).map(fb => {
    const q = qByName.get(norm(fb.query_zh || fb.display_name));
    if (!q) return fb;
    matched += 1;
    const latDiff = Math.abs(Number(fb.manual_lat) - Number(q.lat));
    const lonDiff = Math.abs(Number(fb.manual_lng) - Number(q.lng));
    const conflict = Number.isFinite(latDiff) && Number.isFinite(lonDiff) && (latDiff > 0.03 || lonDiff > 0.03);
    if (conflict) coordinateConflictCount += 1;
    return {
      ...fb,
      display_name: q.display_name || fb.display_name,
      manual_lat: conflict ? fb.manual_lat : (q.lat ?? fb.manual_lat),
      manual_lng: conflict ? fb.manual_lng : (q.lng ?? fb.manual_lng),
      elevation_m: q.elevation_m ?? fb.elevation_m,
      confidence: q.confidence_final || fb.confidence,
      recommended_query: q.recommended_query_zh || fb.recommended_query,
      needs_manual_review: fb.needs_manual_review || q.ambiguity_risk === 'high',
      v7_quality: {
        confidence_final: q.confidence_final || fb.confidence || 'B',
        ambiguity_risk: q.ambiguity_risk || 'unknown',
        recommended_query_zh: q.recommended_query_zh || '',
        review_note: q.review_note || '',
        coordinate_conflict_preserved_v6: conflict
      }
    };
  });
  const sortedModules = [...(modules.modules || [])].sort((a, b) => (b.mobile_priority || 0) - (a.mobile_priority || 0));
  const out = {
    ...base,
    version: 'v7',
    generated_at: new Date().toISOString(),
    geocode_fallbacks: fallbacks,
    decision_modules: sortedModules,
    merged_from: [
      ...(base.merged_from || []),
      'data/inbox/2026-05-24/nova7-review/weather_decision_quality_v7.json',
      'data/inbox/2026-05-24/nova7-review/weather_modules_v7.json'
    ],
    merge_report: {
      ...(base.merge_report || {}),
      version: 'v7',
      geocode_fallbacks_count: fallbacks.length,
      v7_quality_matched_count: matched,
      coordinate_conflict_preserved_v6_count: coordinateConflictCount,
      needs_manual_review_count: fallbacks.filter(x => x.needs_manual_review).length,
      high_ambiguity_count: fallbacks.filter(x => x.v7_quality?.ambiguity_risk === 'high').length,
      decision_module_count: sortedModules.length
    }
  };
  write('data/processed/weather_console_v7.json', out);
  return out.merge_report;
}

console.log('routes', mergeRoutes());
console.log('weather', mergeWeather());
