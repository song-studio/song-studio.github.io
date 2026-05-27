#!/usr/bin/env python3
"""批量验证87个地点坐标 - 高德API"""

import json, urllib.request, urllib.parse, time, math, sys

AMAP_KEY = "39a8c2f6ef75e494198f3e3751701ebe"

def geocode_amap(query):
    url = f"https://restapi.amap.com/v3/place/text?key={AMAP_KEY}&keywords={urllib.parse.quote(query)}&offset=1"
    try:
        req = urllib.request.Request(url)
        # 通过代理（Clash）
        req.add_header("User-Agent", "Mozilla/5.0")
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        if data.get("status") == "1" and data.get("pois"):
            p = data["pois"][0]
            lng, lat = p["location"].split(",")
            return float(lat), float(lng), p.get("name",""), p.get("address",""), True
        return None, None, "", "", False
    except Exception as e:
        return None, None, "", "", False

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

# 从v5文件中读取87个地点
with open("/Users/song/Desktop/Codex/song-studio.github.io/song-studio.github.io-work/data/processed/weather_console_v5.json", "r") as f:
    v5 = json.load(f)

# 提取geocode_fallbacks
locations = []
in_fallbacks = False
# 直接从v3.1文件读
with open("/Users/song/Desktop/Codex/song-studio.github.io/song-studio.github.io-work/data/inbox/2026-05-20/weather_geocode_fallbacks_v3_1.json", "r") as f:
    locations = json.load(f)

print(f"加载 {len(locations)} 个地点")

results = []
errors = []

for i, loc in enumerate(locations):
    name = loc["query_zh"]
    mlat = loc["manual_lat"]
    mlng = loc["manual_lng"]
    
    # 决定用什么关键词查高德
    preferred = loc.get("preferred_query", "")
    if "手动输入" in preferred:
        results.append({
            "query_zh": name,
            "geocode_source": "manual_fallback",
            "manual_lat": mlat,
            "manual_lng": mlng,
            "amap_lat": None,
            "amap_lng": None,
            "deviation_m": 0,
            "corrected": False,
            "note": "非行政区划名，高德查不到，保留手动坐标"
        })
        print(f"  [{i+1}/87] {name}: 手动坐标，跳过API")
        continue
    
    # 构建查询词
    query = preferred.replace("高德地理编码: ", "").strip() or name
    
    time.sleep(0.15)  # 限速
    alat, alng, poi_name, addr, ok = geocode_amap(query)
    
    if not ok or alat is None:
        # 尝试fallback
        fallbacks = loc.get("fallback_queries", [])
        for fb in fallbacks:
            time.sleep(0.15)
            alat, alng, poi_name, addr, ok = geocode_amap(fb)
            if ok:
                break
    
    if not ok or alat is None:
        errors.append(name)
        results.append({
            "query_zh": name,
            "geocode_source": "manual_fallback",
            "manual_lat": mlat,
            "manual_lng": mlng,
            "amap_lat": None,
            "amap_lng": None,
            "deviation_m": 0,
            "corrected": False,
            "note": "高德无结果，保留手动坐标"
        })
        print(f"  [{i+1}/87] {name}: 高德查不到")
        continue
    
    dev = haversine(mlat, mlng, alat, alng)
    corrected = dev > 2000
    
    result = {
        "query_zh": name,
        "geocode_source": "amap_api",
        "manual_lat_before": mlat,
        "manual_lng_before": mlng,
        "amap_lat": round(alat, 6),
        "amap_lng": round(alng, 6),
        "amap_poi": poi_name,
        "amap_address": addr,
        "deviation_m": round(dev, 1),
        "corrected": corrected,
        "note": ""
    }
    
    if corrected:
        result["corrected_lat"] = round(alat, 6)
        result["corrected_lng"] = round(alng, 6)
        result["note"] = f"偏差{dev:.0f}m，已修正为高德坐标"
    else:
        result["note"] = f"偏差{dev:.0f}m，在2km范围内，保留原坐标"
    
    results.append(result)
    status = "⚠️修正" if corrected else "✓通过"
    print(f"  [{i+1}/87] {name}: 偏差{dev:.0f}m {status} (高德: {alat:.4f},{alng:.4f})")

output = {
    "version": "v6_verified",
    "total": len(locations),
    "verified_count": len(results) - len(errors),
    "corrected_count": sum(1 for r in results if r.get("corrected")),
    "error_count": len(errors),
    "errors": errors,
    "results": results
}

with open("/Users/song/Desktop/Codex/song-studio.github.io/song-studio.github.io-work/data/inbox/2026-05-24/nova-weather/geocode_fallbacks_v6_verified.json", "w") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n完成！总计{len(results)}条")
print(f"已修正: {output['corrected_count']}条")
print(f"错误: {output['error_count']}条")
