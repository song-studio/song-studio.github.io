import fs from 'node:fs';

const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (p, data) => fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
const useful = (x) => x !== undefined && x !== null && String(x).trim() !== '';

const base = read('data/processed/outdoor_routes_v7.json');
const access = read('data/inbox/2026-05-24/nova9-link-access/track_link_access_v9.json').routes || [];
const patch = read('data/inbox/2026-05-24/nova9-link-access/track_link_upgrade_patch_v9.json').updates || [];

const accessById = new Map(access.filter(x => x.route_id).map(x => [x.route_id, x]));
const patchById = new Map(patch.filter(x => x.route_id).map(x => [x.route_id, x.patch_fields || {}]));

function truthFromPatch(route, pf, audit) {
  const url = pf.public_track_url || '';
  const grade = pf.track_grade_verified || route.track_truth_v7?.grade || route.track_grade || 'unverified';
  const isReal = grade === 'real_track';
  const isSource = grade === 'source_track';
  return {
    ...(route.track_truth_v7 || {}),
    grade,
    can_navigate: pf.can_navigate === true,
    public_track_url: url,
    public_track_label: pf.public_track_label || '',
    source_name: pf.public_track_label || (url ? new URL(url).hostname.replace(/^www\./, '') : route.track_truth_v7?.source_name || ''),
    evidence_note: isReal ? '公开轨迹链接已通过 Nova9 人工复核。' : isSource ? '公开来源链接已通过 Nova9 人工复核，出发前仍需下载离线轨迹复核。' : (route.track_truth_v7?.evidence_note || ''),
    user_warning_zh: pf.can_navigate === true
      ? '公开轨迹可作为参考。出发前仍需下载离线文件，并复核天气、封控和现场路况。'
      : '有公开来源，但不可直接导航。请下载 GPX、两步路或官方轨迹交叉核验。',
    access_status: audit?.access_status || 'public_open',
    last_verified_date: '2026-05-24',
    track_confidence: pf.track_confidence || (isReal ? 'A' : 'B')
  };
}

function truthFromAudit(route, audit) {
  const old = route.track_truth_v7 || {};
  if (!audit) return old;
  if (audit.grade === 'road_navigation') {
    return {
      ...old,
      grade: 'road_navigation',
      can_navigate: true,
      public_track_url: '',
      public_track_label: '',
      source_name: '道路导航',
      evidence_note: audit.note || '道路骑行/摩旅路线，可使用常规导航应用，不等同于户外 GPX。',
      user_warning_zh: '这是道路骑行/摩旅线路，使用高德、OSM 等道路导航复核；不按徒步 GPX 处理。',
      access_status: 'road_navigation',
      last_verified_date: '2026-05-24',
      track_confidence: 'B'
    };
  }
  if (audit.grade === 'banned') {
    return {
      ...old,
      grade: 'banned',
      can_navigate: false,
      public_track_url: '',
      public_track_label: '',
      source_name: '',
      evidence_note: audit.note || '路线存在禁行或关闭风险。',
      user_warning_zh: '该路线已关闭或禁止穿越。本站不提供可导航轨迹。',
      access_status: 'not_allowed',
      last_verified_date: '2026-05-24',
      track_confidence: 'A'
    };
  }
  if (audit.has_public_track === false) {
    return {
      ...old,
      grade: audit.grade || old.grade || 'unverified',
      can_navigate: false,
      public_track_url: '',
      public_track_label: '',
      source_name: '',
      evidence_note: audit.note || old.evidence_note || '未找到可公开展示的轨迹链接。',
      user_warning_zh: '暂未找到可公开展示的轨迹。请自行下载可信 GPX 或官方线路复核，不要直接按示意线导航。',
      access_status: 'no_public_track',
      last_verified_date: '2026-05-24',
      track_confidence: old.track_confidence || 'C'
    };
  }
  return old;
}

const routes = (base.routes || []).map(route => {
  const audit = accessById.get(route.route_id);
  const pf = patchById.get(route.route_id);
  const nextTruth = pf ? truthFromPatch(route, pf, audit) : truthFromAudit(route, audit);
  const publicUrl = nextTruth.public_track_url || '';
  return {
    ...route,
    track_grade: nextTruth.grade || route.track_grade,
    gpx_url: publicUrl,
    track_truth_v7: nextTruth,
    track_link_v10: {
      has_public_track: Boolean(publicUrl),
      best_public_url: publicUrl,
      label: nextTruth.public_track_label || nextTruth.source_name || '',
      source: pf ? 'nova9_patch' : audit ? 'nova9_access_audit' : 'v7_retained'
    }
  };
});

const out = {
  ...base,
  version: 'v10',
  generated_at: new Date().toISOString(),
  generated_from: [
    ...(base.generated_from || []),
    'data/inbox/2026-05-24/nova9-link-access/track_link_access_v9.json',
    'data/inbox/2026-05-24/nova9-link-access/track_link_upgrade_patch_v9.json'
  ],
  routes,
  v10_review: {
    principle: '能公开打开的轨迹链接进入页面；打不开、私有、禁行或无证据的路线不展示链接，只展示警示。',
    patch_count: patch.length,
    access_audit_count: access.length
  },
  merge_report: {
    ...(base.merge_report || {}),
    version: 'v10',
    route_count: routes.length,
    public_track_count: routes.filter(r => useful(r.track_truth_v7?.public_track_url)).length,
    real_track_count: routes.filter(r => r.track_truth_v7?.grade === 'real_track').length,
    source_track_count: routes.filter(r => r.track_truth_v7?.grade === 'source_track').length,
    road_navigation_count: routes.filter(r => r.track_truth_v7?.grade === 'road_navigation').length,
    banned_count: routes.filter(r => r.track_truth_v7?.grade === 'banned').length,
    no_public_track_count: routes.filter(r => r.track_truth_v7?.access_status === 'no_public_track').length
  }
};

write('data/processed/outdoor_routes_v10.json', out);
console.log(out.merge_report);
