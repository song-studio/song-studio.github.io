#!/usr/bin/env python3
"""批量验证87个地点坐标 - v2: 国内用高德验证，海外用Open-Meteo验证"""

import json, urllib.request, urllib.parse, time, math, sys

AMAP_KEY = "39a8c2f6ef75e494198f3e3751701ebe"

def geocode_amap(query):
    """高德地理编码，限中国地区"""
    url = f"https://restapi.amap.com/v3/place/text?key={AMAP_KEY}&keywords={urllib.parse.quote(query)}&offset=1"
    try:
        req = urllib.request.Request(url)
        req.add_header("User-Agent", "Mozilla/5.0")
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        if data.get("status") == "1" and data.get("pois"):
            p = data["pois"][0]
            lng, lat = p["location"].split(",")
            return float(lat), float(lng), p.get("name",""), p.get("address",""), True
        return None, None, "", "", False
    except:
        return None, None, "", "", False

def geocode_openmeteo(query):
    """Open-Meteo地理编码，全球"""
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(query)}&count=3&language=en&format=json"
    try:
        resp = urllib.request.urlopen(url, timeout=10)
        data = json.loads(resp.read())
        if data.get("results"):
            r = data["results"][0]
            return r["latitude"], r["longitude"], r.get("name",""), r.get("country",""), True
        return None, None, "", "", False
    except:
        return None, None, "", "", False

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def is_overseas(name, loc):
    """判断是否为海外地点"""
    overseas_indicators = ["Nepal","Chamonix","Zermatt","Kilimanjaro","Patagonia","Inca","Fuji",
                           "Dolomites","Grand Canyon","Yosemite","Banff","Snowdonia","Trolltunga",
                           "Mount Cook","Rinjani","Kinabalu","Salkantay","Bergen","Death Valley",
                           "Sahara","Reykjavik","Everest Base","Annapurna"]
    for ind in overseas_indicators:
        if ind in name:
            return True
    return False

with open("/Users/song/Desktop/Codex/song-studio.github.io/song-studio.github.io-work/data/inbox/2026-05-20/weather_geocode_fallbacks_v3_1.json", "r") as f:
    locations = json.load(f)

print(f"加载 {len(locations)} 个地点")

results = []

for i, loc in enumerate(locations):
    name = loc["query_zh"]
    mlat = loc["manual_lat"]
    mlng = loc["manual_lng"]
    preferred = loc.get("preferred_query", "")
    
    result = {
        "query_zh": name,
        "manual_lat": mlat,
        "manual_lng": mlng
    }
    
    # 海外地点 → 用Open-Meteo
    if is_overseas(name, loc):
        # 用英文名搜索
        search_name = name.split(",")[0].strip() if "," in name else name.replace(" ", "+")
        # 去掉中文表述
        if "Mount" in name or "Everest" in name or "Annapurna" in name or "Chamonix" in name:
            search_name = name.split("(")[0].strip() if "(" in name else name
        
        # 简化search name
        om_name = loc.get("fallback_queries", [name])[0] if loc.get("fallback_queries") else name
        if om_name and "," in om_name and not " " in om_name.replace(",", "").strip():
            # It's a coordinate, skip API
            result["geocode_source"] = "manual_coordinates"
            result["amap_lat"] = None
            result["amap_lng"] = None
            result["deviation_m"] = 0
            result["corrected"] = False
            result["note"] = "海外地点，使用手动坐标"
            results.append(result)
            print(f"  [{i+1}/87] {name}: 海外手动坐标，跳过API")
            continue
        
        time.sleep(0.15)
        alat, alng, poi_name, addr, ok = geocode_openmeteo(search_name)
        
        if ok and alat:
            dev = haversine(mlat, mlng, alat, alng)
            corrected = dev > 2000
            result["geocode_source"] = "open_meteo_geocoding"
            result["api_lat"] = round(alat, 6)
            result["api_lng"] = round(alng, 6)
            result["api_name"] = poi_name
            result["api_country"] = addr
            result["deviation_m"] = round(dev, 1)
            result["corrected"] = corrected
            if corrected:
                result["corrected_lat"] = round(alat, 6)
                result["corrected_lng"] = round(alng, 6)
            result["note"] = f"Open-Meteo: 偏差{dev:.0f}m"
        else:
            result["geocode_source"] = "manual_fallback"
            result["api_lat"] = None
            result["api_lng"] = None
            result["deviation_m"] = 0
            result["corrected"] = False
            result["note"] = "Open-Meteo查不到，保留手动坐标"
        
        results.append(result)
        print(f"  [{i+1}/87] {name}: {'✓通过' if not result.get('corrected') else '⚠️修正'} ({result['note']})")
        continue
    
    # 中国地点 → 高德API
    if "手动输入" in preferred:
        result["geocode_source"] = "manual_fallback"
        result["api_lat"] = None
        result["api_lng"] = None
        result["deviation_m"] = 0
        result["corrected"] = False
        result["note"] = "非行政区划名，手动坐标"
        results.append(result)
        print(f"  [{i+1}/87] {name}: 手动坐标")
        continue
    
    # 构建合适的查询词
    clean_query = preferred.replace("高德地理编码: ", "").strip() or name
    
    # 针对特殊地点的优化查询
    special_queries = {
        "四姑娘山镇": ["日隆镇", "四川省小金县四姑娘山镇"],
        "雪乡": ["海林市双峰林场", "黑龙江海林雪乡"],
        "柴达木盆地翡翠湖": ["大柴旦翡翠湖", "青海大柴旦翡翠湖"],
        "独库公路": ["新疆独库公路", "独山子独库公路"],
        "阿里暗夜公园": ["阿里天文台", "西藏阿里暗夜公园"],
        "纳木错": ["纳木错景区", "西藏纳木错扎西半岛"],
        "色达五明佛学院": ["色达喇荣五明佛学院", "四川色达佛学院"],
        "喀纳斯湖": ["喀纳斯景区", "新疆喀纳斯景区"],
        "赛里木湖": ["赛里木湖景区", "新疆赛里木湖"],
        "青海湖": ["青海湖景区", "青海省青海湖二郎剑"],
        "大理古城": ["大理古城景区", "云南大理古城"],
        "稻城亚丁": ["稻城亚丁景区", "四川稻城亚丁"],
        "九寨沟": ["九寨沟景区", "四川九寨沟"],
        "武功山": ["武功山金顶", "江西武功山"],
        "泸沽湖": ["泸沽湖景区", "云南泸沽湖"],
        "贡嘎山": ["贡嘎山风景区", "四川贡嘎山"],
        "西双版纳热带雨林": ["西双版纳热带植物园", "云南西双版纳"],
        "天山天池": ["天山天池景区", "新疆天山天池"],
        "张掖丹霞": ["张掖七彩丹霞", "甘肃张掖七彩丹霞"],
        "鳌太线": ["塘口村", "陕西太白塘口村"],
        "珠峰大本营": ["珠穆朗玛峰大本营", "西藏珠峰大本营"],
        "羊卓雍错": ["羊卓雍措景区", "西藏羊卓雍措"],
        "林芝": ["林芝市", "西藏林芝"],
        "雅鲁藏布大峡谷": ["雅鲁藏布大峡谷景区", "西藏雅鲁藏布大峡谷"],
    }
    
    alt_queries = special_queries.get(name, [])
    
    time.sleep(0.15)
    alat, alng, poi_name, addr, ok = geocode_amap(clean_query)
    
    # 如果第一次失败或偏差异常大，尝试备选查询
    if not ok:
        for aq in alt_queries:
            time.sleep(0.15)
            alat, alng, poi_name, addr, ok = geocode_amap(aq)
            if ok:
                break
    
    if not ok:
        # 尝试fallback_queries
        for fb in loc.get("fallback_queries", []):
            time.sleep(0.15)
            alat, alng, poi_name, addr, ok = geocode_amap(fb)
            if ok:
                break
    
    if not ok or alat is None:
        result["geocode_source"] = "manual_fallback"
        result["api_lat"] = None
        result["api_lng"] = None
        result["deviation_m"] = 0
        result["corrected"] = False
        result["note"] = "高德无结果，保留手动坐标"
        results.append(result)
        print(f"  [{i+1}/87] {name}: 高德查不到")
        continue
    
    dev = haversine(mlat, mlng, alat, alng)
    
    # 如果偏差>20km，说明匹配到了错误的地点，改用备选查询
    if dev > 20000 and alt_queries:
        for aq in alt_queries:
            time.sleep(0.15)
            a2lat, a2lng, p2name, a2addr, ok2 = geocode_amap(aq)
            if ok2:
                dev2 = haversine(mlat, mlng, a2lat, a2lng)
                if dev2 < dev:
                    alat, alng, poi_name, addr = a2lat, a2lng, p2name, a2addr
                    dev = dev2
                    break
    
    corrected = dev > 2000
    
    result["geocode_source"] = "amap_api"
    result["amap_poi"] = poi_name
    result["amap_address"] = addr
    result["api_lat"] = round(alat, 6)
    result["api_lng"] = round(alng, 6)
    result["deviation_m"] = round(dev, 1)
    result["corrected"] = corrected
    if corrected:
        result["corrected_lat"] = round(alat, 6)
        result["corrected_lng"] = round(alng, 6)
    result["note"] = f"高德: 偏差{dev:.0f}m{' 已修正' if corrected else ' 原坐标可用'}"
    
    results.append(result)
    status = "✓" if not corrected else "⚠️修"
    print(f"  [{i+1}/87] {name}: 偏差{dev:.0f}m {status}")

# 汇总
corrected = sum(1 for r in results if r.get("corrected"))
manual_skipped = sum(1 for r in results if r.get("geocode_source") in ("manual_fallback","manual_coordinates"))

output = {
    "version": "v6_verified",
    "total": len(locations),
    "corrected_count": corrected,
    "manual_skip_count": manual_skipped,
    "note": f"国内地点用高德API验证，海外地点用Open-Meteo Geocoding。偏差>2km自动修正。",
    "results": results
}

with open("/Users/song/Desktop/Codex/song-studio.github.io/song-studio.github.io-work/data/inbox/2026-05-24/nova-weather/geocode_fallbacks_v6_verified.json", "w") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n=== 完成 ===")
print(f"总计: {len(results)}条")
print(f"已修正: {corrected}条")
print(f"手动坐标保留: {manual_skipped}条")
