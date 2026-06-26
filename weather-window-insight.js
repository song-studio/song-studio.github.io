(() => {
  const AMAP_KEY = '39a8c2f6ef75e494198f3e3751701ebe';
  const PANEL_ID = 'song-weather-window-insight';
  const STYLE_ID = 'song-weather-window-insight-style';
  const WMO = {
    0: '晴朗', 1: '大部晴朗', 2: '局部多云', 3: '多云', 45: '雾', 48: '雾凇',
    51: '小毛毛雨', 53: '毛毛雨', 55: '较强毛毛雨', 61: '小雨', 63: '中雨',
    65: '较强降雨', 71: '小雪', 73: '中雪', 75: '较强降雪', 80: '短时小阵雨',
    81: '短时阵雨', 82: '短时强阵雨', 85: '短时小阵雪', 86: '短时强阵雪',
    95: '雷雨', 96: '雷雨伴小冰雹', 99: '雷雨伴较强冰雹'
  };
  const PLACE_HINTS = [
    ['哈巴村', '云南省迪庆藏族自治州香格里拉市哈巴村', ['哈巴雪山村', '哈巴雪山登山口']],
    ['雨崩村', '云南省迪庆藏族自治州德钦县雨崩村', ['上雨崩', '下雨崩', '雨崩徒步']],
    ['鱼子西', '四川省甘孜藏族自治州康定市鱼子西', ['鱼子西星空营地', '新都桥鱼子西']],
    ['冷嘎措', '四川省甘孜藏族自治州康定市冷嘎措', ['贡嘎冷嘎措', '冷嘎措徒步']],
    ['子梅垭口', '四川省甘孜藏族自治州康定市子梅垭口', ['贡嘎子梅垭口']],
    ['格聂之眼', '四川省甘孜藏族自治州理塘县格聂之眼', ['格聂眼睛湖']],
    ['四姑娘山', '四川省阿坝藏族羌族自治州小金县四姑娘山', ['长坪沟', '双桥沟', '海子沟']],
    ['长坪沟', '四川省阿坝藏族羌族自治州小金县长坪沟', ['四姑娘山长坪沟']],
    ['稻城亚丁', '四川省甘孜藏族自治州稻城县稻城亚丁', ['亚丁景区', '香格里拉镇']],
    ['琼库什台', '新疆维吾尔自治区伊犁哈萨克自治州特克斯县琼库什台', ['琼库什台村']],
    ['夏塔', '新疆维吾尔自治区伊犁哈萨克自治州昭苏县夏塔', ['夏塔古道', '夏塔景区']],
    ['喀纳斯', '新疆维吾尔自治区阿勒泰地区布尔津县喀纳斯', ['喀纳斯湖']],
    ['禾木村', '新疆维吾尔自治区阿勒泰地区布尔津县禾木村', ['禾木景区']],
    ['珠峰大本营', '西藏自治区日喀则市定日县珠峰大本营', ['绒布寺']],
    ['冈仁波齐', '西藏自治区阿里地区普兰县冈仁波齐', ['塔钦', '冈仁波齐转山']],
    ['武功山', '江西省萍乡市芦溪县武功山', ['金顶', '发云界', '沈子村']],
    ['沈子村', '江西省萍乡市芦溪县沈子村', ['武功山沈子村']],
    ['太白山', '陕西省宝鸡市眉县太白山', ['拔仙台']],
    ['扎尕那', '甘肃省甘南藏族自治州迭部县扎尕那', ['扎尕那景区']],
    ['库拉岗日', '西藏自治区山南市洛扎县库拉岗日', ['白马林措']],
    ['乌孙古道', '新疆维吾尔自治区伊犁哈萨克自治州昭苏县乌孙古道', ['天堂湖']]
  ];
  const GENERIC = new Set(['天池', '月亮湖', '白沙湖', '大本营', '垭口', '山口', '营地', '观景台', '古道', '草原', '雪山', '冰川', '海子']);

  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const fmt = (v, suffix = '', digits = null) => {
    const n = num(v);
    if (n === null) return '--';
    return `${digits === null ? Math.round(n) : n.toFixed(digits)}${suffix}`;
  };
  const at = (arr, i) => Array.isArray(arr) && arr[i] !== undefined ? arr[i] : null;
  const clean = (s) => String(s || '').trim();
  const compact = (s) => clean(s).replace(/\s+/g, '').toLowerCase();
  const weatherName = (code) => WMO[Number(code)] || '--';
  const hourLabel = (iso) => clean(iso).includes('T') ? clean(iso).split('T')[1].slice(0, 5) : '--';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID}{margin:18px auto;max-width:1180px;padding:0 16px;color:#eaf7f3;font-family:inherit}
      #${PANEL_ID} .swi-wrap{border:1px solid rgba(45,212,191,.18);border-radius:28px;background:linear-gradient(135deg,rgba(10,25,41,.96),rgba(7,17,31,.92));box-shadow:0 20px 70px rgba(0,0,0,.22);overflow:hidden}
      #${PANEL_ID} .swi-head{display:flex;gap:18px;align-items:flex-start;justify-content:space-between;padding:22px 22px 14px;border-bottom:1px solid rgba(148,163,184,.14)}
      #${PANEL_ID} .swi-kicker{font-size:12px;letter-spacing:.18em;color:#7dd3fc;font-weight:800}
      #${PANEL_ID} .swi-title{margin-top:8px;font-size:28px;line-height:1.15;font-weight:900}
      #${PANEL_ID} .swi-sub{margin-top:8px;color:rgba(234,247,243,.68);line-height:1.6;font-size:14px}
      #${PANEL_ID} .swi-badge{min-width:78px;text-align:center;border-radius:20px;padding:10px 12px;background:#99f6e4;color:#06251f;font-weight:900}
      #${PANEL_ID} .swi-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:14px;padding:16px}
      #${PANEL_ID} .swi-card{border:1px solid rgba(148,163,184,.14);border-radius:22px;background:rgba(255,255,255,.055);padding:16px}
      #${PANEL_ID} .swi-label{font-size:12px;color:rgba(234,247,243,.58);letter-spacing:.08em;font-weight:800}
      #${PANEL_ID} .swi-big{margin-top:8px;font-size:24px;line-height:1.35;font-weight:900}
      #${PANEL_ID} .swi-muted{color:rgba(234,247,243,.62);line-height:1.6;font-size:13px}
      #${PANEL_ID} .swi-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}
      #${PANEL_ID} .swi-metric{border-radius:16px;background:rgba(255,255,255,.06);padding:12px;min-width:0}
      #${PANEL_ID} .swi-metric b{display:block;font-size:18px;margin-top:5px}
      #${PANEL_ID} .swi-window{display:grid;gap:10px;margin-top:12px}
      #${PANEL_ID} .swi-slot{display:flex;justify-content:space-between;gap:14px;border-radius:18px;padding:12px;background:rgba(45,212,191,.12)}
      #${PANEL_ID} .swi-slot.care{background:rgba(251,191,36,.12)}
      #${PANEL_ID} .swi-slot.low{background:rgba(248,113,113,.11)}
      #${PANEL_ID} .swi-score{font-size:26px;font-weight:950;text-align:right}
      #${PANEL_ID} .swi-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
      #${PANEL_ID} .swi-tag{border-radius:999px;background:rgba(45,212,191,.13);color:#99f6e4;padding:6px 10px;font-size:12px}
      #${PANEL_ID} .swi-tips{display:grid;gap:8px;margin-top:12px}
      #${PANEL_ID} .swi-tip{border-radius:16px;background:rgba(251,191,36,.11);padding:10px 12px;color:#fff7d6;line-height:1.55;font-size:13px}
      #${PANEL_ID} .swi-error{padding:18px 22px;color:#fde68a;line-height:1.6}
      @media(max-width:760px){#${PANEL_ID}{padding:0 12px;margin:14px auto}#${PANEL_ID} .swi-grid{grid-template-columns:1fr;padding:12px}#${PANEL_ID} .swi-head{padding:18px 16px 12px}#${PANEL_ID} .swi-title{font-size:23px}#${PANEL_ID} .swi-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.appendChild(style);
  }

  function parseCoord(query) {
    const m = clean(query).match(/^(-?\d+(?:\.\d+)?)\s*[,，\s]\s*(-?\d+(?:\.\d+)?)$/);
    if (!m) return null;
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return { lat: a, lon: b, name: '坐标位置', admin: '' };
    if (Math.abs(a) <= 180 && Math.abs(b) <= 90) return { lat: b, lon: a, name: '坐标位置', admin: '' };
    return null;
  }

  function enhancedQueries(query) {
    const raw = clean(query);
    if (!raw || GENERIC.has(raw)) return [raw];
    const q = compact(raw);
    const variants = [raw];
    PLACE_HINTS.forEach(([name, full, aliases]) => {
      const tokens = [name].concat(aliases || []);
      if (tokens.some((t) => compact(t) === q || compact(t).includes(q) || q.includes(compact(t)))) {
        variants.push(full);
        (aliases || []).forEach((alias) => variants.push(full.replace(name, alias)));
      }
    });
    return Array.from(new Set(variants.filter(Boolean))).slice(0, 10);
  }

  async function geocode(query) {
    const coord = parseCoord(query);
    if (coord) return Object.assign(coord, { source: '坐标输入', confidence: '高' });
    const variants = enhancedQueries(query);
    for (const keywords of variants) {
      const url = new URL('https://restapi.amap.com/v3/place/text');
      url.searchParams.set('key', AMAP_KEY);
      url.searchParams.set('keywords', keywords);
      url.searchParams.set('offset', '8');
      url.searchParams.set('page', '1');
      url.searchParams.set('extensions', 'base');
      try {
        const res = await fetch(url.toString());
        const json = await res.json();
        const pois = Array.isArray(json.pois) ? json.pois.filter((p) => p.location) : [];
        if (!pois.length) continue;
        const first = pois[0];
        const [lon, lat] = first.location.split(',').map(Number);
        return {
          name: first.name || query,
          admin: [first.pname, first.cityname, first.adname].filter(Boolean).join(' '),
          lat,
          lon,
          source: variants.length > 1 ? '高德地点检索 + 本地点名增强' : '高德地点检索',
          confidence: pois.length <= 2 || variants.length > 1 ? '中' : '需核对',
          ambiguity: pois.length > 1 ? '存在相近地点，建议补充省市区、县乡或景区名进一步确认。' : ''
        };
      } catch (err) {}
    }
    throw new Error('没有找到这个地点。请补充省、市、县、乡镇或景区名后再试。');
  }

  async function getWeather(lat, lon) {
    const hourly = 'temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,pressure_msl,visibility,uv_index,cape';
    const daily = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max,uv_index_max';
    const current = 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,pressure_msl';
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('current', current);
    url.searchParams.set('hourly', hourly);
    url.searchParams.set('daily', daily);
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '7');
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('天气数据获取失败，请稍后再试。');
    return res.json();
  }

  async function getElevation(lat, lon) {
    try {
      const url = new URL('https://api.open-meteo.com/v1/elevation');
      url.searchParams.set('latitude', lat);
      url.searchParams.set('longitude', lon);
      const res = await fetch(url.toString());
      const json = await res.json();
      const value = Array.isArray(json.elevation) ? json.elevation[0] : json.elevation;
      return num(value) === null ? null : Math.round(Number(value));
    } catch (err) {
      return null;
    }
  }

  function score(metrics) {
    let s = 100;
    const rain = num(metrics.rain) || 0;
    const precip = num(metrics.precip) || 0;
    const gust = num(metrics.gust) || 0;
    const vis = num(metrics.visibility);
    const cape = num(metrics.cape) || 0;
    const uv = num(metrics.uv) || 0;
    const apparent = num(metrics.apparent);
    s -= rain * 0.35;
    s -= Math.min(precip * 12, 28);
    if (gust > 28) s -= (gust - 28) * 0.9;
    if (gust > 45) s -= 12;
    if (vis !== null && vis < 10000) s -= (10000 - vis) / 800;
    if (cape > 500) s -= (cape - 500) / 70;
    if (uv > 6) s -= (uv - 6) * 4;
    if (apparent !== null && (apparent < -8 || apparent > 35)) s -= 10;
    return Math.max(0, Math.min(100, Math.round(s)));
  }

  function reason(metrics) {
    const out = [];
    if (num(metrics.rain) >= 55) out.push('降水概率偏高');
    if (num(metrics.gust) >= 38) out.push('阵风偏强');
    if (num(metrics.visibility) !== null && num(metrics.visibility) < 6000) out.push('能见度偏低');
    if (num(metrics.cape) >= 900) out.push('对流能量偏高');
    if (num(metrics.uv) >= 7) out.push('紫外线偏强');
    return out.length ? out.join('、') : '主要指标相对平稳';
  }

  function buildInsight(weather, elevation) {
    const h = weather.hourly || {};
    const d = weather.daily || {};
    const c = weather.current || {};
    const slots = [];
    for (let i = 0; i < Math.min((h.time || []).length, 24); i += 3) {
      const m = {
        rain: at(h.precipitation_probability, i),
        precip: at(h.precipitation, i),
        gust: at(h.wind_gusts_10m, i),
        visibility: at(h.visibility, i),
        cape: at(h.cape, i),
        uv: at(h.uv_index, i),
        apparent: at(h.apparent_temperature, i)
      };
      const s = score(m);
      slots.push({ time: hourLabel(h.time[i]), score: s, reason: reason(m), tone: s >= 66 ? 'ok' : s >= 48 ? 'care' : 'low' });
    }
    const best = slots.slice().sort((a, b) => b.score - a.score).slice(0, 2);
    const tags = [];
    if (num(elevation) >= 3000) tags.push('高海拔');
    if (num(c.wind_gusts_10m || c.wind_speed_10m) >= 35) tags.push('风感明显');
    if (num(at(d.precipitation_probability_max, 0)) >= 50) tags.push('湿润时段');
    if (num(c.relative_humidity_2m) >= 85) tags.push('潮湿体感');
    if (num(at(d.uv_index_max, 0)) >= 7) tags.push('强日照');
    if (!tags.length) tags.push('常规天气');
    const tips = [];
    if (best.length) tips.push(`优先参考 ${best[0].time} 前后的天气窗口，出门前再刷新一次。`);
    if (num(at(d.precipitation_probability_max, 0)) >= 45) tips.push('带轻量雨具，电子设备做好防水。');
    if (num(c.wind_gusts_10m || c.wind_speed_10m) >= 35) tips.push('开阔地、山口、湖边风感更明显，建议准备防风外层。');
    if (num(at(d.uv_index_max, 0)) >= 6) tips.push('准备遮阳帽、太阳镜和防晒。');
    if (num(elevation) >= 3000) tips.push('高海拔地点建议放慢节奏，留意体感变化。');
    if (!tips.length) tips.push('轻量外套、饮水和基础防晒即可，按实际停留时长调整。');
    return { slots, best, tags, tips };
  }

  function panel() {
    injectStyle();
    let el = document.getElementById(PANEL_ID);
    if (el) return el;
    el = document.createElement('section');
    el.id = PANEL_ID;
    const main = document.querySelector('main') || document.body;
    main.insertBefore(el, main.firstChild);
    return el;
  }

  function escapeHtml(value) {
    return clean(value).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
  function renderLoading(query) {
    panel().innerHTML = `<div class="swi-wrap"><div class="swi-error">正在为「${escapeHtml(query)}」生成地点天气窗口...</div></div>`;
  }
  function renderError(message) {
    panel().innerHTML = `<div class="swi-wrap"><div class="swi-error">${escapeHtml(message)}</div></div>`;
  }
  function render(place, weather, elevation, insight) {
    const c = weather.current || {};
    const d = weather.daily || {};
    const bestText = insight.best.length ? insight.best.map((x) => x.time).join('、') : '稍后刷新';
    panel().innerHTML = `
      <div class="swi-wrap">
        <div class="swi-head">
          <div>
            <div class="swi-kicker">WEATHER WINDOW INSIGHT</div>
            <div class="swi-title">${escapeHtml(place.name)} · 地点天气窗口</div>
            <div class="swi-sub">${escapeHtml(place.admin || '行政区待核对')} · ${fmt(place.lat, '', 5)}, ${fmt(place.lon, '', 5)} · 海拔 ${elevation === null ? '--' : elevation}m · ${escapeHtml(place.source)}${place.ambiguity ? ' · ' + escapeHtml(place.ambiguity) : ''}</div>
          </div>
          <div class="swi-badge">${escapeHtml(place.confidence)}<br><span style="font-size:12px">可信度</span></div>
        </div>
        <div class="swi-grid">
          <div class="swi-card">
            <div class="swi-label">天气窗口摘要</div>
            <div class="swi-big">今天相对更舒服的时段是 ${escapeHtml(bestText)}</div>
            <div class="swi-tags">${insight.tags.map((t) => `<span class="swi-tag">${escapeHtml(t)}</span>`).join('')}</div>
            <div class="swi-metrics">
              <div class="swi-metric"><span class="swi-muted">当前</span><b>${escapeHtml(weatherName(c.weather_code))}</b></div>
              <div class="swi-metric"><span class="swi-muted">温度</span><b>${fmt(c.temperature_2m, '°')}</b></div>
              <div class="swi-metric"><span class="swi-muted">体感</span><b>${fmt(c.apparent_temperature, '°')}</b></div>
              <div class="swi-metric"><span class="swi-muted">阵风</span><b>${fmt(c.wind_gusts_10m || c.wind_speed_10m, 'km/h')}</b></div>
              <div class="swi-metric"><span class="swi-muted">降水</span><b>${fmt(at(d.precipitation_probability_max, 0), '%')}</b></div>
              <div class="swi-metric"><span class="swi-muted">UV</span><b>${fmt(at(d.uv_index_max, 0))}</b></div>
            </div>
          </div>
          <div class="swi-card">
            <div class="swi-label">装备清单</div>
            <div class="swi-tips">${insight.tips.map((t) => `<div class="swi-tip">${escapeHtml(t)}</div>`).join('')}</div>
          </div>
          <div class="swi-card">
            <div class="swi-label">未来 24 小时窗口评分</div>
            <div class="swi-window">${insight.slots.map((s) => `<div class="swi-slot ${s.tone}"><div><b>${escapeHtml(s.time)}</b><div class="swi-muted">${escapeHtml(s.reason)}</div></div><div class="swi-score">${s.score}</div></div>`).join('')}</div>
          </div>
          <div class="swi-card">
            <div class="swi-label">数据边界</div>
            <div class="swi-sub">定位来自高德地点检索，天气和海拔来自 Open-Meteo。该模块提供出行参考，不替代现场判断；重名地点请补充省市区、县乡或景区名。</div>
          </div>
        </div>
      </div>
    `;
  }

  async function run(query) {
    query = clean(query);
    if (!query) return;
    renderLoading(query);
    try {
      const place = await geocode(query);
      const [weather, elevation] = await Promise.all([getWeather(place.lat, place.lon), getElevation(place.lat, place.lon)]);
      render(place, weather, elevation, buildInsight(weather, elevation));
    } catch (err) {
      renderError(err && err.message ? err.message : '生成失败，请补充省市区后再试。');
    }
  }

  function currentQuery() {
    const fromUrl = new URLSearchParams(location.search).get('q');
    if (fromUrl) return fromUrl;
    const inputs = Array.from(document.querySelectorAll('input, textarea'));
    const hit = inputs.find((input) => clean(input.value));
    return hit ? hit.value : '';
  }

  function bind() {
    const initial = currentQuery();
    if (initial) run(initial);
    document.addEventListener('click', () => {
      setTimeout(() => {
        const q = currentQuery();
        if (q) run(q);
      }, 450);
    }, true);
    document.addEventListener('submit', () => {
      setTimeout(() => {
        const q = currentQuery();
        if (q) run(q);
      }, 450);
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
