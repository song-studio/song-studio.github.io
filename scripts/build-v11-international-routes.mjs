import fs from 'node:fs';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, data) => fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 46);

const basePath = 'data/processed/outdoor_routes_v10.json';
const intlPath = 'data/inbox/2026-05-24/nova-routes/international_routes_v6.json';
const outPath = 'data/processed/outdoor_routes_v11.json';

const base = read(basePath);
const intl = read(intlPath).routes || [];
const existingKeys = new Set((base.routes || []).map(r => [r.name_zh, r.name_en, r.country_or_region].filter(Boolean).join('|').toLowerCase()));
const existingNames = new Set((base.routes || []).map(r => String(r.name_zh || '').trim()).filter(Boolean));

function normalizeIntl(r, i) {
  const mode = r.mode === 'mountaineering' ? 'mountaineering' : r.mode === 'cycling' ? 'cycling' : 'hiking';
  const id = `global_${String(i + 1).padStart(3, '0')}_${slug(r.name_en || r.name_zh) || 'route'}`;
  const country = r.country_or_region || r.country || '海外';
  const season = r.best_season || r.season_status || '季节待核验';
  const duration = r.duration_days || r.duration_h || '时间待核验';
  const altitude = Number(r.max_altitude_m) || null;
  const distance = Number(r.distance_km) || null;
  const risk = [];
  if (altitude >= 5000) risk.push('高海拔5000m+');
  else if (altitude >= 3500) risk.push('高海拔3500m+');
  if (distance >= 150) risk.push('长距离多日线路');
  if (/尼泊尔|秘鲁|坦桑尼亚|肯尼亚|印度尼西亚|巴布亚新几内亚/.test(country)) risk.push('海外许可与向导规则需复核');
  if (/火山|Kilimanjaro|Rinjani|富士|乞力马扎罗/.test(`${r.name_zh} ${r.name_en}`)) risk.push('火山/天气窗口风险');

  return {
    route_id: id,
    name_zh: r.name_zh,
    name_en: r.name_en || '',
    aliases: [r.name_en].filter(Boolean),
    mode,
    activity_type: mode,
    region_scope: 'global',
    region_text: `${country} · 国外精选`,
    region_text_zh: `${country} · 国外精选`,
    country_or_region: country,
    nearest_city: r.nearest_city || '',
    nearest_transport_hub: r.nearest_transport_hub || '',
    start_poi: r.start_poi || '起点待核验',
    end_poi: r.end_poi || '终点待核验',
    distance_km: distance,
    elevation_gain_m: Number(r.elevation_gain_m) || null,
    max_altitude_m: altitude,
    duration_days: duration,
    season_status: season,
    best_season: season,
    risk_tags: risk.length ? risk : ['海外线路资料需出发前复核'],
    water_points: [],
    resupply_points: [],
    retreat_points: [],
    permit_required: /尼泊尔|秘鲁|坦桑尼亚|日本|美国|智利|新西兰|马来西亚|印度尼西亚/.test(country),
    permit_how: '按目的地国家、公园或保护区规则复核许可、预约和向导要求。',
    access_status: '需出发前复核',
    gpx_url: '',
    confidence_grade: 'B',
    geometry_confidence: 'D',
    track_type: 'unverified',
    track_points: [],
    segments: [],
    cycling_ops: null,
    cycling_poi: [],
    mountaineering: mode === 'mountaineering' ? {
      route_id: id,
      name_zh: r.name_zh,
      mountain_altitude_m: altitude,
      basecamp: r.start_poi || '',
      camps: [],
      summit_push_start_time: '待核验',
      turnaround_time: '待核验',
      technical_grade: '海外经典登山线路，需按当地商业队/公园规则复核',
      terrain_type: '待核验',
      required_gear: '按海拔、季节和当地向导要求配置',
      guide_or_permit_required: '需复核',
      objective_hazards: risk.join('、') || '海外环境与天气风险',
      weather_abort_thresholds: '出发前复核当地气象、封控和向导建议。'
    } : null,
    mountaineering_geo: [],
    campsites: [],
    huts: [],
    signal_coverage: '海外线路信号差异大，需准备离线地图、纸质备份和当地应急电话。',
    emergency_access_score: '待核验',
    emergency_access_note: '海外救援规则、保险和通信方式需单独确认。',
    gear_essential: [
      '离线地图与备用电源',
      '目的地许可/预约证明',
      '旅行保险与救援信息',
      altitude >= 3500 ? '高海拔适应计划' : '分层防雨保暖'
    ].filter(Boolean),
    route_variants: [],
    decision_v7: {
      decision_level: altitude >= 5000 ? 'amber' : 'green',
      summary: `国外精选线路：${country}，${distance || '--'}km，最高海拔 ${altitude || '--'}m。当前先作为灵感和初筛，不冒充可导航轨迹。`,
      go_no_go_factors: [
        `最佳季节：${season}`,
        `预计时间：${duration}`,
        '确认许可、预约、向导和保险后再制定行程',
        '下载当地可信 GPX 或官方轨迹，本站不提供导航承诺'
      ],
      hard_stop_rules: [
        '无法确认许可/封控时不出发',
        '无离线轨迹和当地应急方案时不出发',
        altitude >= 3500 ? '高海拔不适或适应不足时停止上升' : '恶劣天气或路线关闭时停止'
      ],
      who_should_avoid_zh: altitude >= 3500 ? '无高海拔经验、无保险或无向导支持者不建议贸然尝试。' : '第一次海外户外者应选择成熟服务商或低风险替代线。',
      best_window: season
    },
    track_truth_v7: {
      grade: 'unverified',
      can_navigate: false,
      public_track_url: '',
      public_track_label: '',
      source_name: 'Nova international route list',
      evidence_note: 'Nova v6 提供的国外经典线路基础清单，未完成公开轨迹可访问性复核。',
      user_warning_zh: '国外精选仅作路线初筛。未接入公开可导航轨迹，请使用当地官方资料、商业向导或可信 GPX 复核。',
      access_status: 'needs_external_verification',
      last_verified_date: '2026-05-24',
      track_confidence: 'D'
    },
    track_link_v10: {
      has_public_track: false,
      best_public_url: '',
      label: '',
      source: 'nova_v6_international_unverified'
    },
    source_urls: r.source_urls || []
  };
}

const normalized = intl
  .filter(r => r.name_zh && r.mode)
  .filter(r => !existingNames.has(String(r.name_zh || '').trim()))
  .filter(r => !existingKeys.has([r.name_zh, r.name_en, r.country_or_region].filter(Boolean).join('|').toLowerCase()))
  .map(normalizeIntl);

const routes = [...(base.routes || []), ...normalized];
const out = {
  ...base,
  version: 'v11',
  generated_at: new Date().toISOString(),
  generated_from: [
    ...(base.generated_from || []),
    intlPath
  ],
  routes,
  v11_review: {
    principle: '国外线路只合入经典精选和基础决策信息；没有公开轨迹复核的，不伪装成可导航线路。',
    added_international_routes: normalized.length,
    source: intlPath
  },
  merge_report: {
    ...(base.merge_report || {}),
    version: 'v11',
    route_count: routes.length,
    domestic_route_count: routes.filter(r => r.region_scope !== 'global').length,
    international_route_count: routes.filter(r => r.region_scope === 'global').length,
    public_track_count: routes.filter(r => r.track_truth_v7?.public_track_url).length,
    unverified_track_count: routes.filter(r => r.track_truth_v7?.grade === 'unverified').length
  }
};

write(outPath, out);
console.log(out.merge_report);
