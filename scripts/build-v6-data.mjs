import fs from 'node:fs';
import path from 'node:path';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, data) => fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
const norm = (s = '') => String(s).replace(/[\s()（）·・,，、-]/g, '').toLowerCase();
const uniq = (arr = []) => [...new Set(arr.filter(Boolean).map(x => typeof x === 'string' ? x.trim() : x).filter(Boolean))];
const byName = (arr) => new Map(arr.map(x => [norm(x.name_zh || x.query_zh || x.display_name || x.name), x]));
const byRouteId = (arr) => new Map(arr.filter(x => x.route_id).map(x => [x.route_id, x]));

function uniqueId(base, used) {
  let id = String(base || 'route').replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
  if (!id || id === 'undefined') id = 'route';
  let out = id, n = 2;
  while (used.has(out)) out = `${id}_${n++}`;
  used.add(out);
  return out;
}

function mergeRoutes() {
  const v5 = read('data/processed/outdoor_routes_v5.json');
  const domesticV6 = read('data/inbox/2026-05-24/nova-routes/route_full_verification_v6.json');
  const intl = read('data/inbox/2026-05-24/nova-routes/international_routes_v6.json').routes || [];
  const gpx = read('data/inbox/2026-05-24/nova-routes/gpx_links_v6.json').routes || [];
  const depth = read('data/inbox/2026-05-24/nova-routes/cycling_motorcycle_depth_v6.json');
  const emergency = read('data/inbox/2026-05-24/nova-routes/emergency_info_v6.json');

  const v5Name = byName(v5.routes || []);
  const v5Id = byRouteId(v5.routes || []);
  const gpxName = byName(gpx);
  const emergencyName = byName([...(emergency.domestic || []), ...(emergency.international || [])]);
  const depthItems = [...(depth.bicycle || []), ...(depth.motorcycle || [])];
  const depthId = byRouteId(depthItems);
  const depthName = byName(depthItems);
  const used = new Set();
  const matchedV5 = new Set();

  function enrichRoute(r, scope = 'domestic') {
    const old = v5Name.get(norm(r.name_zh)) || v5Id.get(r.route_id) || {};
    if (old.route_id) matchedV5.add(old.route_id);
    const routeId = uniqueId(old.route_id || r.route_id || `${scope}_${norm(r.name_en || r.name_zh)}`, used);
    const g = gpxName.get(norm(r.name_zh)) || {};
    const e = emergencyName.get(norm(r.name_zh)) || {};
    const d = depthId.get(r.route_id) || depthName.get(norm(r.name_zh)) || {};
    const distance = r.distance_km ?? r.distance_km_v5 ?? old.distance_km;
    const elevationGain = r.elevation_gain_m ?? old.elevation_gain_m ?? r.cumulative_elevation;
    const maxAlt = r.max_altitude_m ?? old.max_altitude_m;
    const mode = r.mode || old.mode || 'hiking';
    const merged = {
      ...old,
      ...r,
      route_id: routeId,
      source_route_id_v6: r.route_id,
      mode,
      activity_type: mode,
      region_scope: scope === 'global' ? 'global' : (r.region_scope || old.region_scope || 'domestic'),
      distance_km: distance,
      elevation_gain_m: elevationGain,
      max_altitude_m: maxAlt,
      name_en: r.name_en || old.name_en || '',
      aliases: uniq([...(old.aliases || []), r.name_en, ...(r.aliases || [])]),
      risk_tags: uniq([...(r.risk_tags || []), ...(old.risk_tags || [])]).slice(0, 12),
      water_points: uniq(r.water_points?.length ? r.water_points : old.water_points),
      retreat_points: uniq(r.retreat_points?.length ? r.retreat_points : old.retreat_points),
      resupply_points: uniq(old.resupply_points || []),
      permit_required: r.permit_required ?? old.permit_required ?? false,
      permit_how: r.permit_how || old.permit_how || '',
      regulation_note: r.regulation_note || e.regulation_note || old.regulation_note || '',
      access_status: r.access_status || e.access_status || old.access_status || '',
      emergency_access_score: r.emergency_access_score || e.emergency_access_score || old.emergency_access_score || old.ops?.emergency_access_score || '',
      emergency_access_note: r.emergency_access_note || e.emergency_access_detail || '',
      nearest_city: r.nearest_city || e.nearest_city || e.nearest_town || old.nearest_city || '',
      nearest_transport_hub: r.nearest_transport_hub || e.nearest_transport_hub || old.nearest_transport_hub || '',
      signal_coverage: r.signal_coverage || e.signal_coverage || old.signal_coverage || '',
      signal_dead_zones: r.signal_dead_zones || e.signal_dead_zones || old.signal_dead_zones || '',
      last_signal_point: r.last_signal_point || e.last_signal_point || old.last_signal_point || '',
      season_status: r.season_status || r.best_season || old.season_status || old.ops?.season_status || '',
      gpx_url: g.sample_track_url || old.gpx_url || r.gpx_url || '',
      gpx_search_url: g.search_url || old.gpx_search_url || '',
      track_quality: g.track_quality || old.track_quality || '',
      cycling_depth: mode === 'cycling' || mode === 'motorcycle' ? d : old.cycling_depth,
      ops: {
        ...(old.ops || {}),
        season_status: r.season_status || r.best_season || old.ops?.season_status || '',
        emergency_access_score: r.emergency_access_score || e.emergency_access_score || old.ops?.emergency_access_score || '',
        access_status: r.access_status || e.access_status || '',
        permit_required: r.permit_required ?? old.permit_required ?? false,
        last_verified_date: r.last_verified_date || '2026-05-24'
      },
      confidence_grade: r.confidence || old.confidence_grade || old.data_confidence || 'B',
      data_confidence: r.confidence || old.data_confidence || old.confidence_grade || 'B',
      verification_sources: uniq([...(r.verification_sources || []), ...(e.verification_sources || []), ...(old.verification_sources || [])])
    };
    if (!merged.track_points && old.track_points) merged.track_points = old.track_points;
    if (!merged.track_type && old.track_type) merged.track_type = old.track_type;
    if (!merged.track_grade && old.track_grade) merged.track_grade = old.track_grade;
    if (!merged.geometry_confidence && old.geometry_confidence) merged.geometry_confidence = old.geometry_confidence;
    return merged;
  }

  const routes = domesticV6.map(r => enrichRoute(r, 'domestic'));
  for (const old of v5.routes || []) {
    if (!matchedV5.has(old.route_id)) {
      routes.push({
        ...old,
        route_id: uniqueId(old.route_id, used),
        legacy_retained: true,
        data_confidence: old.data_confidence || old.confidence_grade || 'B',
        confidence_grade: old.confidence_grade || old.data_confidence || 'B',
        ops: {...(old.ops || {}), last_verified_date: old.ops?.last_verified_date || '2026-05-21'}
      });
    }
  }
  const existingNames = new Set(routes.map(r => norm(r.name_zh)));
  const intlNew = intl.filter(r => !existingNames.has(norm(r.name_zh)));
  routes.push(...intlNew.map((r, i) => enrichRoute({
    ...r,
    route_id: `intl_${String(i + 1).padStart(3, '0')}`,
    confidence: r.confidence || 'B',
    risk_tags: r.risk_tags || ['海外路线', '需核验许可/保险', '需查看当地天气窗口'],
    water_points: r.water_points || ['沿途城镇/营地补给，出发前核验'],
    retreat_points: r.retreat_points || ['沿途城镇或官方营地撤退，需核验交通'],
    season_status: r.best_season || '',
    duration_h: r.duration_h || '',
  }, 'global')));

  const out = {
    version: 'v6',
    generated_at: new Date().toISOString(),
    generated_from: [
      'data/processed/outdoor_routes_v5.json',
      'data/inbox/2026-05-24/nova-routes/route_full_verification_v6.json',
      'data/inbox/2026-05-24/nova-routes/international_routes_v6.json',
      'data/inbox/2026-05-24/nova-routes/gpx_links_v6.json',
      'data/inbox/2026-05-24/nova-routes/cycling_motorcycle_depth_v6.json',
      'data/inbox/2026-05-24/nova-routes/emergency_info_v6.json'
    ],
    routes,
    other: [],
    track_label_rules: v5.track_label_rules,
    merge_report: {
      route_count: routes.length,
      domestic_v6_count: domesticV6.length,
      international_v6_count: intl.length,
      international_added_count: intlNew.length,
      international_deduped_count: intl.length - intlNew.length,
      retained_v5_count: routes.filter(r => r.legacy_retained).length,
      mode_counts: routes.reduce((m, r) => (m[r.mode] = (m[r.mode] || 0) + 1, m), {}),
      region_counts: routes.reduce((m, r) => (m[r.region_scope || 'domestic'] = (m[r.region_scope || 'domestic'] || 0) + 1, m), {})
    }
  };
  write('data/processed/outdoor_routes_v6.json', out);
  return out.merge_report;
}

function mergeWeather() {
  const v5 = read('data/processed/weather_console_v5.json');
  const verified = read('data/inbox/2026-05-24/nova-weather/geocode_fallbacks_v6_verified.json');
  const supplement = read('data/inbox/2026-05-24/nova-weather/geocode_fallbacks_v6_supplement.json');
  const elevations = read('data/inbox/2026-05-24/nova-weather/location_elevations_v6.json').elevations || [];
  const ambiguity = read('data/inbox/2026-05-24/nova-weather/ambiguity_notes_v6_verified.json').notes || [];
  const thunder = read('data/inbox/2026-05-24/nova-weather/thunderstorm_data_source_v6.json');
  const apiTest = read('data/inbox/2026-05-24/nova-weather/api_live_test_v6.json');
  const elevName = new Map(elevations.map(x => [norm(x.name), x]));
  const ambName = new Map(ambiguity.map(x => [norm(x.query_zh || x.display_name), x]));
  // v6 weather should be trusted data only: 87 verified + 45 supplement.
  // Older v5-only fallbacks stay out until a later audit proves them.
  const map = new Map();
  for (const x of verified.results || []) {
    const old = (v5.geocode_fallbacks || []).find(y => norm(y.query_zh) === norm(x.query_zh)) || {};
    map.set(norm(x.query_zh), {
      ...old,
      query_zh: x.query_zh,
      preferred_query: old.preferred_query || x.amap_poi || x.query_zh,
      fallback_queries: old.fallback_queries || [],
      manual_lat: x.final_lat ?? x.corrected_lat ?? x.manual_lat,
      manual_lng: x.final_lng ?? x.corrected_lng ?? x.manual_lng,
      ambiguity_note: x.manual_note || x.note || old.ambiguity_note || '',
      display_name: old.display_name || x.amap_poi || x.query_zh,
      source_urls: old.source_urls || ['https://lbs.amap.com/'],
      confidence: x.final_corrected ? 'A' : (old.confidence || 'B'),
      geocode_audit_v6: x
    });
  }
  for (const x of supplement.locations || []) {
    const old = map.get(norm(x.query_zh)) || {};
    map.set(norm(x.query_zh), {
      ...old,
      ...x,
      manual_lat: x.manual_lat ?? old.manual_lat,
      manual_lng: x.manual_lng ?? old.manual_lng,
      confidence: x.confidence || old.confidence || 'A'
    });
  }
  const fallbacks = [...map.values()].map(x => {
    const e = elevName.get(norm(x.query_zh)) || elevName.get(norm(x.display_name));
    const a = ambName.get(norm(x.query_zh)) || ambName.get(norm(x.display_name));
    return {
      ...x,
      elevation_m: e?.elevation_m ?? a?.elevation_m ?? x.elevation_m,
      elevation_source: e?.source || x.elevation_source,
      ambiguity_note: Array.isArray(a?.ambiguity_notes) ? a.ambiguity_notes.join('；') : (a?.ambiguity_notes || x.ambiguity_note),
      recommended_query: a?.recommended_query || x.recommended_query || x.preferred_query,
      needs_manual_review: a?.needs_manual_review === true || x.needs_manual_review === true
    };
  }).sort((a,b)=>String(a.query_zh).localeCompare(String(b.query_zh),'zh-Hans-CN'));

  const existingMetricIds = new Set((v5.metrics || []).map(x => x.metric_id));
  const metrics = [...(v5.metrics || [])];
  if (!existingMetricIds.has('cape')) {
    metrics.push({
      metric_id: 'cape',
      name_zh: 'CAPE 对流能量',
      name_en: 'Convective Available Potential Energy',
      unit: 'J/kg',
      category: 'thunderstorm',
      priority: 2,
      why_it_matters: '判断雷暴和强对流发展潜力。山脊、山顶、开阔地带尤其敏感。',
      normal_range_note: '<300 通常较低，300-800 关注，800-1500 警戒，≥1500 危险。',
      caution_threshold: 'cape >= 300',
      danger_threshold: 'cape >= 1500',
      data_sources: ['Open-Meteo forecast hourly cape'],
      display_hint_mobile: '作为雷暴模块核心指标显示。'
    });
  }
  const out = {
    ...v5,
    version: 'v6',
    generated_at: new Date().toISOString(),
    metrics,
    geocode_fallbacks: fallbacks,
    thunderstorm: thunder,
    api_live_test: apiTest,
    merged_from: [
      ...(v5.merged_from || []),
      'data/inbox/2026-05-24/nova-weather/geocode_fallbacks_v6_verified.json',
      'data/inbox/2026-05-24/nova-weather/geocode_fallbacks_v6_supplement.json',
      'data/inbox/2026-05-24/nova-weather/location_elevations_v6.json',
      'data/inbox/2026-05-24/nova-weather/ambiguity_notes_v6_verified.json',
      'data/inbox/2026-05-24/nova-weather/thunderstorm_data_source_v6.json',
      'data/inbox/2026-05-24/nova-weather/api_live_test_v6.json'
    ],
    merge_report: {
      geocode_fallbacks_count: fallbacks.length,
      corrected_count: verified.corrected_count,
      supplement_count: supplement.locations?.length || 0,
      elevation_count: fallbacks.filter(x => Number.isFinite(x.elevation_m)).length,
      needs_manual_review_count: fallbacks.filter(x => x.needs_manual_review).length,
      api_live_test_success: `${apiTest.success}/${apiTest.total_tested}`
    }
  };
  write('data/processed/weather_console_v6.json', out);
  return out.merge_report;
}

console.log('routes', mergeRoutes());
console.log('weather', mergeWeather());
