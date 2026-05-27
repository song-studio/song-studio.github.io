#!/bin/bash
# 批量获取海拔 - 用curl更快更稳定
VERIFIED="/Users/song/Desktop/Codex/song-studio.github.io/song-studio.github.io-work/data/inbox/2026-05-24/nova-weather/geocode_fallbacks_v6_verified.json"
SUPPLEMENT="/Users/song/Desktop/Codex/song-studio.github.io/song-studio.github.io-work/data/inbox/2026-05-24/nova-weather/geocode_fallbacks_v6_supplement.json"
OUTPUT="/Users/song/Desktop/Codex/song-studio.github.io/song-studio.github.io-work/data/inbox/2026-05-24/nova-weather/location_elevations_v6.json"

# 提取所有坐标到临时文件
python3 -c "
import json
verified = json.load(open('$VERIFIED'))
supplement = json.load(open('$SUPPLEMENT'))

with open('/tmp/elev_coords.txt','w') as f:
    for r in verified['results']:
        lat = r.get('corrected_lat', r['manual_lat'])
        lng = r.get('corrected_lng', r['manual_lng'])
        f.write(f\"{r['query_zh']}|{lat}|{lng}|existing\n\")
    for loc in supplement['locations']:
        f.write(f\"{loc['query_zh']}|{loc['manual_lat']}|{loc['manual_lng']}|supplement|{loc.get('elevation_m',0)}\n\")
print('坐标已提取')
"

echo "[" > "$OUTPUT"
sep=""
total=$(wc -l < /tmp/elev_coords.txt)
i=0

while IFS='|' read -r name lat lng source existing_elev; do
    i=$((i+1))
    
    # 如果已有海拔，直接写
    if [ "$existing_elev" != "0" ] && [ -n "$existing_elev" ] && [ "$existing_elev" != "" ]; then
        echo -n "${sep}{\"name\":\"${name}\",\"elevation_m\":${existing_elev},\"source\":\"supplement_data\"}" >> "$OUTPUT"
        echo "  [$i/$total] $name: ${existing_elev}m (已有)"
    else
        # 调Open-Meteo API
        resp=$(curl -s --connect-timeout 5 --max-time 8 "https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m&forecast_days=1" 2>/dev/null)
        elev=$(echo "$resp" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('elevation','null'))" 2>/dev/null)
        if [ "$elev" = "null" ] || [ -z "$elev" ]; then
            echo -n "${sep}{\"name\":\"${name}\",\"elevation_m\":null,\"source\":\"failed\",\"note\":\"API无返回\"}" >> "$OUTPUT"
            echo "  [$i/$total] $name: FAIL"
        else
            echo -n "${sep}{\"name\":\"${name}\",\"elevation_m\":${elev},\"source\":\"open_meteo_grid\"}" >> "$OUTPUT"
            echo "  [$i/$total] $name: ${elev}m"
        fi
    fi
    sep=","
    sleep 0.05
done < /tmp/elev_coords.txt

echo "]" >> "$OUTPUT"

# 写汇总信息
python3 -c "
import json
with open('$OUTPUT') as f:
    d = json.load(f)
total = len(d)
with_elev = sum(1 for r in d if r.get('elevation_m') is not None)
print(f'完成！{with_elev}/{total} 个地点获取到海拔')
with open('$OUTPUT','w') as f:
    json.dump({'version':'v6_elevations','total':total,'with_elevation':with_elev,'failed':total-with_elev,'elevations':d}, f, ensure_ascii=False, indent=2)
"
