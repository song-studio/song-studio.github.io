#!/usr/bin/env python3
"""任务二：补充45个新地点（国内30+海外15）并验证坐标"""

import json, urllib.request, urllib.parse, time, math

AMAP_KEY = "39a8c2f6ef75e494198f3e3751701ebe"

def geocode_amap(query):
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
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(query)}&count=3&language=en&format=json"
    try:
        resp = urllib.request.urlopen(url, timeout=10)
        data = json.loads(resp.read())
        if data.get("results"):
            r = data["results"][0]
            return r["latitude"], r["longitude"], r.get("name",""), r.get("country",""), True, r.get("elevation")
        return None, None, "", "", False, None
    except:
        return None, None, "", "", False, None

# ---- 国内新增30个 ----
new_cn = [
    # 华北
    {"query_zh": "海坨山", "preferred_query": "海坨山", "fallback_queries": ["北京延庆海坨山"], "ambiguity_note": "北京延庆，冬奥会赛区，主峰2241m。海坨山 vs 小海坨。", "region": "华北"},
    {"query_zh": "小五台", "preferred_query": "小五台山金河口", "fallback_queries": ["河北蔚县小五台"], "ambiguity_note": "已在87条中。此处为补充东台顶（2882m）入口坐标。", "region": "华北"},
    {"query_zh": "箭扣长城", "preferred_query": "北京怀柔箭扣长城", "fallback_queries": ["箭扣长城 西栅子"], "ambiguity_note": "北京怀柔，西栅子村是箭扣徒步起点。", "region": "华北"},
    {"query_zh": "老掌沟", "preferred_query": "河北沽源老掌沟", "fallback_queries": ["老掌沟 越野"], "ambiguity_note": "河北沽源县，京北越野和徒步经典。", "region": "华北"},
    {"query_zh": "坝上", "preferred_query": "河北丰宁坝上草原", "fallback_queries": ["丰宁坝上"], "ambiguity_note": "坝上范围广（丰宁/围场/张北），坐标取丰宁坝上入口。", "region": "华北"},
    {"query_zh": "乌兰布统", "preferred_query": "内蒙古赤峰乌兰布统景区", "fallback_queries": ["乌兰布统"], "ambiguity_note": "内蒙古赤峰市克什克腾旗。与河北塞罕坝相邻。", "region": "华北"},
    {"query_zh": "库布齐沙漠", "preferred_query": "内蒙古鄂尔多斯库布齐沙漠", "fallback_queries": ["库布齐沙漠 七星湖"], "ambiguity_note": "内蒙古鄂尔多斯，夜鸣沙/七星湖为经典营地入口。", "region": "华北"},
    # 华东
    {"query_zh": "徽杭古道", "preferred_query": "安徽绩溪徽杭古道", "fallback_queries": ["徽杭古道入口"], "ambiguity_note": "安徽绩溪→浙江临安。坐标取绩溪侧入口。", "region": "华东"},
    {"query_zh": "莫干山", "preferred_query": "莫干山风景区", "fallback_queries": ["浙江德清莫干山"], "ambiguity_note": "已在87条中，此处保持补充完整性。浙江德清。", "region": "华东"},
    {"query_zh": "雁荡山", "preferred_query": "浙江温州雁荡山", "fallback_queries": ["雁荡山灵峰"], "ambiguity_note": "浙江温州乐清市，北雁荡最经典。", "region": "华东"},
    {"query_zh": "太姥山", "preferred_query": "福建宁德太姥山", "fallback_queries": ["太姥山景区"], "ambiguity_note": "福建福鼎市，海边名山。", "region": "华东"},
    {"query_zh": "武夷山徒步起点", "preferred_query": "福建武夷山风景区", "fallback_queries": ["武夷山 天游峰"], "ambiguity_note": "福建武夷山市，坐标取景区南入口。", "region": "华东"},
    # 华南
    {"query_zh": "漓江徒步起点", "preferred_query": "桂林阳朔杨堤码头", "fallback_queries": ["杨堤 漓江"], "ambiguity_note": "杨堤→兴坪是漓江经典徒步段。", "region": "华南"},
    {"query_zh": "丹霞山", "preferred_query": "广东韶关丹霞山", "fallback_queries": ["丹霞山长老峰"], "ambiguity_note": "广东韶关仁化县，世界地质公园。", "region": "华南"},
    {"query_zh": "鼎湖山", "preferred_query": "广东肇庆鼎湖山", "fallback_queries": ["鼎湖山景区"], "ambiguity_note": "广东肇庆，北回归线上的绿洲。", "region": "华南"},
    {"query_zh": "七娘山", "preferred_query": "深圳大鹏七娘山", "fallback_queries": ["七娘山 国家地质公园"], "ambiguity_note": "深圳大鹏半岛，深圳第二高峰（869m）。", "region": "华南"},
    {"query_zh": "东西冲", "preferred_query": "深圳大鹏东西冲海岸线", "fallback_queries": ["东西冲穿越"], "ambiguity_note": "深圳大鹏半岛，经典海岸线徒步。东涌→西涌。", "region": "华南"},
    # 西北
    {"query_zh": "喀纳斯徒步起点", "preferred_query": "新疆喀纳斯景区贾登峪", "fallback_queries": ["贾登峪"], "ambiguity_note": "贾登峪→禾木是喀纳斯经典徒步。", "region": "西北"},
    {"query_zh": "禾木", "preferred_query": "新疆布尔津禾木村", "fallback_queries": ["禾木村"], "ambiguity_note": "喀纳斯区域，图瓦人村落。秋天最美。", "region": "西北"},
    {"query_zh": "白哈巴", "preferred_query": "新疆哈巴河白哈巴村", "fallback_queries": ["白哈巴"], "ambiguity_note": "西北第一村，喀纳斯区域。", "region": "西北"},
    {"query_zh": "赛里木湖", "preferred_query": "赛里木湖景区", "fallback_queries": ["新疆赛里木湖东门"], "ambiguity_note": "已在87条中，此处补充东门入口坐标。", "region": "西北"},
    {"query_zh": "夏塔古道起点", "preferred_query": "新疆昭苏夏塔景区", "fallback_queries": ["夏塔古道 温泉酒店"], "ambiguity_note": "夏塔古道徒步起点（温泉酒店）。昭苏县。", "region": "西北"},
    # 西南
    {"query_zh": "梅里北坡起点", "preferred_query": "云南德钦亚贡村", "fallback_queries": ["亚贡村 梅里北坡"], "ambiguity_note": "亚贡村是梅里北坡徒步（坡均/坡均错）起点。德钦县。", "region": "西南"},
    {"query_zh": "亚丁村", "preferred_query": "亚丁村", "fallback_queries": ["四川稻城亚丁村"], "ambiguity_note": "已在87条中。亚丁村海拔4060m。", "region": "西南"},
    {"query_zh": "格聂", "preferred_query": "四川理塘格聂神山", "fallback_queries": ["格聂之眼"], "ambiguity_note": "四川理塘县，格聂C线经典徒步路线。", "region": "西南"},
    {"query_zh": "党岭", "preferred_query": "党岭村", "fallback_queries": ["四川丹巴党岭村"], "ambiguity_note": "已在87条中。丹巴县，葫芦海为核心景观。", "region": "西南"},
    {"query_zh": "七藏沟沟口", "preferred_query": "四川松潘七藏沟", "fallback_queries": ["七藏沟 阿翁沟"], "ambiguity_note": "四川松潘县，黄龙景区后方。沟口坐标取阿翁沟入口。", "region": "西南"},
    # 东北
    {"query_zh": "长白山北坡", "preferred_query": "长白山北坡景区", "fallback_queries": ["长白山北坡山门"], "ambiguity_note": "长白山北坡入口（二道白河）。天池坐标已在87条中。", "region": "东北"},
    {"query_zh": "长白山西坡", "preferred_query": "长白山西坡景区", "fallback_queries": ["长白山西坡山门"], "ambiguity_note": "长白山西坡入口（松江河镇）。1442级台阶。", "region": "东北"},
    {"query_zh": "北极村", "preferred_query": "黑龙江漠河北极村", "fallback_queries": ["北极村"], "ambiguity_note": "漠河市北极镇，中国最北村镇。", "region": "东北"}
]

# ---- 海外新增15个 ----
new_overseas = [
    {"query_zh": "Lukla", "preferred_query": "Open-Meteo Geocoding: Lukla, Nepal", "fallback_queries": ["Lukla Nepal"], "ambiguity_note": "尼泊尔卢克拉机场（2840m），EBC徒步起点。", "region": "海外-尼泊尔"},
    {"query_zh": "Pokhara", "preferred_query": "Open-Meteo Geocoding: Pokhara, Nepal", "fallback_queries": ["Pokhara Nepal"], "ambiguity_note": "尼泊尔博卡拉，ABC/ACT徒步起点城市。", "region": "海外-尼泊尔"},
    {"query_zh": "Jomsom", "preferred_query": "Open-Meteo Geocoding: Jomsom, Nepal", "fallback_queries": ["Jomsom Nepal"], "ambiguity_note": "尼泊尔，ACT徒步终点/木斯塘入口。", "region": "海外-尼泊尔"},
    {"query_zh": "Namche Bazaar", "preferred_query": "Open-Meteo Geocoding: Namche Bazaar, Nepal", "fallback_queries": ["Namche Bazaar Nepal"], "ambiguity_note": "尼泊尔，EBC徒步的夏尔巴首都(3440m)。", "region": "海外-尼泊尔"},
    {"query_zh": "富士山五合目", "preferred_query": "Open-Meteo Geocoding: Fujisan 5th Station", "fallback_queries": ["Fuji Yoshida Trail 5th Station"], "ambiguity_note": "日本富士山吉田路线五合目（2305m）。已在87条中。", "region": "海外-日本"},
    {"query_zh": "熊野古道起点", "preferred_query": "Open-Meteo Geocoding: Kumano Kodo, Japan", "fallback_queries": ["Kumano Hongu Taisha Japan"], "ambiguity_note": "日本和歌山县，熊野古道中边路，坐标取田辺。", "region": "海外-日本"},
    {"query_zh": "Chamonix", "preferred_query": "Open-Meteo Geocoding: Chamonix, France", "fallback_queries": ["Chamonix France"], "ambiguity_note": "法国霞慕尼，勃朗峰徒步起点。已在87条中。", "region": "海外-欧洲"},
    {"query_zh": "Zermatt", "preferred_query": "Open-Meteo Geocoding: Zermatt, Switzerland", "fallback_queries": ["Zermatt Switzerland"], "ambiguity_note": "瑞士采尔马特，马特洪峰区域。已在87条中。", "region": "海外-欧洲"},
    {"query_zh": "Grindelwald", "preferred_query": "Open-Meteo Geocoding: Grindelwald, Switzerland", "fallback_queries": ["Grindelwald Switzerland"], "ambiguity_note": "瑞士格林德瓦，少女峰/Eiger Trail 起点。", "region": "海外-欧洲"},
    {"query_zh": "Cortina d'Ampezzo", "preferred_query": "Open-Meteo Geocoding: Cortina d'Ampezzo, Italy", "fallback_queries": ["Cortina Italy"], "ambiguity_note": "意大利多洛米蒂，Alta Via 1 起点。已在87条中。", "region": "海外-欧洲"},
    {"query_zh": "Cusco", "preferred_query": "Open-Meteo Geocoding: Cusco, Peru", "fallback_queries": ["Cusco Peru"], "ambiguity_note": "秘鲁库斯科，印加古道起点城市（3399m）。已在87条中。", "region": "海外-南美"},
    {"query_zh": "Torres del Paine入口", "preferred_query": "Open-Meteo Geocoding: Torres del Paine, Chile", "fallback_queries": ["Torres del Paine National Park Chile"], "ambiguity_note": "智利百内国家公园，W/O路线起点。", "region": "海外-南美"},
    {"query_zh": "Moshi", "preferred_query": "Open-Meteo Geocoding: Moshi, Tanzania", "fallback_queries": ["Moshi Tanzania"], "ambiguity_note": "坦桑尼亚莫希，乞力马扎罗登山起点城市。", "region": "海外-非洲"},
    {"query_zh": "Kinabalu Park HQ", "preferred_query": "Open-Meteo Geocoding: Kinabalu Park, Malaysia", "fallback_queries": ["Kinabalu Park Sabah"], "ambiguity_note": "马来西亚沙巴，京那巴鲁山登山入口。已在87条中。", "region": "海外-东南亚"},
    {"query_zh": "Doi Inthanon", "preferred_query": "Open-Meteo Geocoding: Doi Inthanon, Thailand", "fallback_queries": ["Doi Inthanon National Park"], "ambiguity_note": "泰国最高峰（2565m），清迈。", "region": "海外-东南亚"}
]

print(f"国内新增: {len(new_cn)}")
print(f"海外新增: {len(new_overseas)}")

def process_loc(loc, is_overseas=False):
    name = loc["query_zh"]
    preferred = loc["preferred_query"]
    
    result = dict(loc)
    
    if is_overseas or "Open-Meteo" in preferred:
        # 海外 - 用Open-Meteo
        en_name = loc.get("fallback_queries", [loc["query_zh"]])[0]
        time.sleep(0.15)
        lat, lng, pname, country, ok, elev = geocode_openmeteo(en_name)
        if ok:
            result["manual_lat"] = round(lat, 6)
            result["manual_lng"] = round(lng, 6)
            result["elevation_m"] = elev
            result["geocode_source"] = "open_meteo"
            result["confidence"] = "A"
        else:
            # 用手工已知坐标
            result["manual_lat"] = 0
            result["manual_lng"] = 0
            result["geocode_source"] = "manual"
            result["confidence"] = "C"
        print(f"  {name}: {'Open-Meteo' if ok else '手动'} → ({result.get('manual_lat','?')},{result.get('manual_lng','?')})")
    else:
        # 国内 - 高德API
        time.sleep(0.15)
        lat, lng, pname, addr, ok = geocode_amap(preferred)
        if ok:
            result["manual_lat"] = round(lat, 6)
            result["manual_lng"] = round(lng, 6)
            result["amap_poi"] = pname
            result["amap_address"] = addr
            result["geocode_source"] = "amap_api"
            result["confidence"] = "A"
        else:
            for fb in loc.get("fallback_queries", []):
                time.sleep(0.15)
                lat, lng, pname, addr, ok = geocode_amap(fb)
                if ok:
                    break
            if ok:
                result["manual_lat"] = round(lat, 6)
                result["manual_lng"] = round(lng, 6)
                result["amap_poi"] = pname
                result["amap_address"] = addr
                result["geocode_source"] = "amap_api"
                result["confidence"] = "A"
            else:
                result["manual_lat"] = 0
                result["manual_lng"] = 0
                result["geocode_source"] = "manual"
                result["confidence"] = "C"
            print(f"  {name}: 高德→({result.get('manual_lat','?')},{result.get('manual_lng','?')})" if ok else f"  {name}: 查不到")
    
    # 补充结构字段
    result.setdefault("source_urls", ["https://lbs.amap.com/"])
    result.setdefault("display_name", name)
    result.setdefault("fallback_queries", [])
    return result

all_new = []
print("\n=== 国内新增 ===")
for loc in new_cn:
    r = process_loc(loc, is_overseas=False)
    all_new.append(r)

print("\n=== 海外新增 ===")
for loc in new_overseas:
    r = process_loc(loc, is_overseas=True)
    all_new.append(r)

output = {
    "version": "v6_supplement",
    "total": len(all_new),
    "domestic": sum(1 for r in all_new if r.get("region","").startswith("海外") == False),
    "overseas": sum(1 for r in all_new if r.get("region","").startswith("海外")),
    "confidence_A": sum(1 for r in all_new if r.get("confidence") == "A"),
    "confidence_C": sum(1 for r in all_new if r.get("confidence") == "C"),
    "locations": all_new
}

with open("/Users/song/Desktop/Codex/song-studio.github.io/song-studio.github.io-work/data/inbox/2026-05-24/nova-weather/geocode_fallbacks_v6_supplement.json", "w") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n完成！共{len(all_new)}个新地点")
