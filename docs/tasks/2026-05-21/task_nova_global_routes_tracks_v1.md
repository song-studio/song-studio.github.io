# Nova 任务书：国外线路与真实轨迹补充 v1

请读取本文件，并把成果保存到：

`/Users/song/Desktop/Codex/song-studio.github.io/data/inbox/2026-05-21/`

请不要覆盖已有文件。请新建以下文件：

- `global_routes_v1.json`
- `global_routes_sources_v1.csv`
- `global_routes_qa_v1.md`
- `global_track_sources_v1.json`

## 任务目标

补充国外经典户外线路，并按运动类型归入三类：徒步、骑行 / 摩旅、登山。国外是区域板块，不是运动类型。不要建立“其他户外”或“国外户外”大杂烩。

优先收集有真实轨迹来源的线路。能找到 GPX、KML、GeoJSON 的优先；不能下载轨迹的，记录外部轨迹页；只有关键点的，明确标为关键点示意。

## 运动类型定义

### 徒步 hiking

适合多日步道、山地徒步、经典长线。核心字段是距离、爬升、最高海拔、住宿或营地、补给、撤退点、季节、天气风险。

候选线路示例：

- 尼泊尔 Everest Base Camp Trek
- 尼泊尔 Annapurna Base Camp Trek
- 尼泊尔 Annapurna Circuit
- 环勃朗峰 Tour du Mont Blanc
- 新西兰 Milford Track
- 新西兰 Routeburn Track
- 冰岛 Laugavegur Trail
- 秘鲁 Inca Trail
- 日本 Kumano Kodo
- 西班牙 Camino Frances 精选段

### 骑行 / 摩旅 cycling

适合公路骑行、长距离骑行、摩旅路线。核心字段是路面、车流、补给间距、维修点、横风、长下坡、隧道、天气暴露。

候选线路示例：

- 台湾环岛骑行
- 日本四国骑行
- 日本 Shimanami Kaido
- 欧洲 Danube Cycle Path
- 法国阿尔卑斯经典爬坡段
- 美国 Pacific Coast Bike Route
- 冰岛 Ring Road 骑行 / 摩旅
- 越南 Hai Van Pass 摩旅
- 挪威 Atlantic Road 骑行 / 摩旅

### 登山 mountaineering

适合高海拔登山、入门雪山、经典攀登路线。核心字段是大本营、高营地、冲顶窗口、折返点、技术等级、装备门槛、高反风险、天气红线、救援可达性。

候选线路示例：

- Kilimanjaro Machame Route
- Mount Fuji Yoshida Trail
- Island Peak
- Mera Peak
- Aconcagua Normal Route
- Elbrus South Route
- Toubkal
- Matterhorn 周边入门训练路线，若资料可核验

## 每条线路必须包含字段

```json
{
  "route_id": "global_hiking_tmb_001",
  "name_zh": "环勃朗峰 TMB",
  "name_en": "Tour du Mont Blanc",
  "mode": "hiking | cycling | mountaineering",
  "country_or_region": "France / Italy / Switzerland",
  "region_text_zh": "法国 / 意大利 / 瑞士 · 阿尔卑斯",
  "start_poi": "Les Houches",
  "end_poi": "Les Houches",
  "distance_km": 0,
  "elevation_gain_m": 0,
  "max_altitude_m": 0,
  "duration_days": "",
  "best_season": "",
  "difficulty_level": "beginner | intermediate | advanced | expert",
  "track_grade": "real_track | source_track | key_points | unverified",
  "track_source_type": "gpx | kml | geojson | external_page | key_points_only | none",
  "track_source_url": "",
  "official_or_primary_source_url": "",
  "secondary_source_urls": [],
  "key_points": [
    {"name": "", "lat": 0, "lng": 0, "altitude_m": 0, "point_type": "start | camp | pass | resupply | retreat | summit | end"}
  ],
  "resupply_points": [],
  "retreat_points": [],
  "water_points": [],
  "gear_essential": [],
  "weather_risks": [],
  "safety_notes": [],
  "why_selected": "为什么这条线路值得进入路线决策台",
  "data_confidence": "A | B | C | D",
  "geometry_confidence": "A | B | C | D",
  "verification_notes": ""
}
```

## 轨迹核验规则

- 不要把普通介绍页面当成真实轨迹。
- 真实轨迹必须能下载或解析为 GPX、KML、GeoJSON。
- 如果只能打开网页但不能下载，标为 `source_track`。
- 如果只有关键地点，标为 `key_points`。
- 如果经纬度来自推测，标为 `unverified` 或降低 `geometry_confidence`。

## 数量要求

第一批请收集 30 到 45 条。页面后续会增加“国内 / 国外 / 全部”筛选，所以每条必须填好国家、地区和运动类型：

- 徒步 12 到 18 条
- 骑行 / 摩旅 8 到 12 条
- 登山 8 到 12 条

宁可少而准，不要多而乱。

## QA 文件要求

`global_routes_qa_v1.md` 请回答：

- 哪些线路有真实 GPX/KML/GeoJSON？
- 哪些只有外部轨迹页？
- 哪些只是关键点示意？
- 哪些数据不确定，不能上线？
- 哪些字段最容易出错？
- 哪些线路建议第二批继续深挖？
