#!/usr/bin/env python3
"""用已知坐标修复 15 个海外地点的坐标"""

import json

# 海外地点已知坐标
overseas_fixes = {
    "Lukla": {"lat": 27.6873, "lng": 86.7314, "elev": 2840, "country": "Nepal"},
    "Pokhara": {"lat": 28.2096, "lng": 83.9856, "elev": 827, "country": "Nepal"},
    "Jomsom": {"lat": 28.7836, "lng": 83.7336, "elev": 2743, "country": "Nepal"},
    "Namche Bazaar": {"lat": 27.8050, "lng": 86.7100, "elev": 3440, "country": "Nepal"},
    "富士山五合目": {"lat": 35.3606, "lng": 138.7300, "elev": 2305, "country": "Japan"},
    "熊野古道起点": {"lat": 33.7275, "lng": 135.3780, "elev": 50, "country": "Japan"},
    "Chamonix": {"lat": 45.9237, "lng": 6.8694, "elev": 1035, "country": "France"},
    "Zermatt": {"lat": 46.0200, "lng": 7.7490, "elev": 1620, "country": "Switzerland"},
    "Grindelwald": {"lat": 46.6240, "lng": 8.0410, "elev": 1034, "country": "Switzerland"},
    "Cortina d'Ampezzo": {"lat": 46.5375, "lng": 12.1365, "elev": 1224, "country": "Italy"},
    "Cusco": {"lat": -13.5320, "lng": -71.9675, "elev": 3399, "country": "Peru"},
    "Torres del Paine入口": {"lat": -51.0000, "lng": -73.0000, "elev": 150, "country": "Chile"},
    "Moshi": {"lat": -3.3350, "lng": 37.3400, "elev": 890, "country": "Tanzania"},
    "Kinabalu Park HQ": {"lat": 6.0080, "lng": 116.5430, "elev": 1563, "country": "Malaysia"},
    "Doi Inthanon": {"lat": 18.5890, "lng": 98.4870, "elev": 2565, "country": "Thailand"}
}

with open("/Users/song/Desktop/Codex/song-studio.github.io/song-studio.github.io-work/data/inbox/2026-05-24/nova-weather/geocode_fallbacks_v6_supplement.json", "r") as f:
    data = json.load(f)

fixed = 0
for loc in data["locations"]:
    name = loc["query_zh"]
    if name in overseas_fixes:
        fix = overseas_fixes[name]
        loc["manual_lat"] = fix["lat"]
        loc["manual_lng"] = fix["lng"]
        loc["elevation_m"] = fix["elev"]
        loc["geocode_source"] = "known_coordinates"
        loc["confidence"] = "A"
        if "country" not in loc:
            loc["country"] = fix["country"]
        fixed += 1
        print(f"  {name}: ({fix['lat']},{fix['lng']}) elev={fix['elev']}m")

data["confidence_A"] = data["confidence_A"] + fixed
data["confidence_C"] = data["confidence_C"] - fixed

with open("/Users/song/Desktop/Codex/song-studio.github.io/song-studio.github.io-work/data/inbox/2026-05-24/nova-weather/geocode_fallbacks_v6_supplement.json", "w") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\n已修复 {fixed} 个海外地点的坐标")
print(f"最终: 置信度A={data['confidence_A']}, 置信度C={data['confidence_C']}")
