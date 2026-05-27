# Leo 路线数据校对与补全任务书

> 下发时间：2026-05-24
> 产出目录：data/inbox/2026-05-24/leo-routes/
> 参考数据：data/processed/outdoor_routes_v5.json、data/inbox/2026-05-20/ 下所有 route_ 和 cycling_ 和 mountaineering_ 和 other_outdoor_ 开头文件

---

## 任务一：89条线路逐条校对

每条线路重点校对这些字段，不能留"待核验"：

| 字段 | 要求 |
|------|------|
| distance_km | 确认精度。来源是实测还是估算？标注来源 |
| elevation_gain_m | 同上 |
| max_altitude_m | 同上 |
| season_status | 改掉所有"待核验"。写具体：最佳月份/可行月份/封闭月份 |
| water_points | 每条至少 2 个水源点名。真的没有水源的标注"全程无水，需背水" |
| retreat_points | 每条至少 1 个撤退点。没有的标注撤退方案 |
| risk_tags | 不少于 3 个风险标签 |

输出文件：`route_verification_v6.json`（只包含有修改的字段，不要全量复制）

---

## 任务二：真实 GPX 轨迹收集（30条核心线路）

89条里大部分是"关键点示意"（key_points），目标是至少 30 条拿到可用的外部 GPX 链接。

**优先找这些平台**：
1. 两步路 (2bulu.com) —— 国内最多
2. 六只脚 (foooooot.com)
3. 8264 户外资料网
4. 行者 (xingzhe.im) —— 骑行

**30条优先线路**（国内最经典的）：
- 虎跳峡高路、雨崩、武功山、鳌太、墨脱、珠峰东坡、长穿毕、扎尕那
- 七藏沟、四姑娘山二峰、哈巴雪山、冈仁波齐转山、梅里外转
- 独库公路、318川藏南线、环青海湖、环海南岛、新藏线
- 箭扣长城、南太行、徽杭古道、漓江徒步、稻城亚丁
- 他念他翁、乌孙古道、夏塔古道、喀纳斯环线、党岭
- 库拉岗日、希夏邦马

对每条线路：
- 找到至少一个可用的 GPX 链接（两步路轨迹页 URL 就行）
- 标注轨迹质量：A=官方/成熟轨迹、B=热门上传轨迹、C=少量记录
- 标注轨迹类型：real_track（真实轨迹） vs key_points（关键点）
- 如果实在找不到，标注 `unavailable_reason`

输出文件：`gpx_links_v6.json`

---

## 任务三：补全季节、水源、撤退信息

这是户外决策最核心的三个字段。89条线路逐条补：

**季节窗口**：
- 写格式：`最佳：X月-Y月，可行：X月-Y月，封闭：X月-Y月`
- 参考来源：8264攻略、马蜂窝游记、Wikipedia
- 高原线注意标注雨季（7-8月）、雪季（12-3月）

**水源**：
- 至少 2 个水源点名 + 大致位置
- 干旱线路标注"全程无水"或"仅XX有水源"

**撤退**：
- 标注可撤退的下撤路线或最近的公路/村庄
- 标注救援可达性：`emergency_access_score：良好/一般/困难/直升机`

输出文件：`season_water_retreat_v6.json`

---

## 任务四：国外经典线路补充（+30条）

目前几乎所有线路是国内。加 30 条国外经典。

**优先补充**（有代表性、有中文攻略）：
- 尼泊尔：EBC、ABC、ACT 安娜普尔纳大环、Langtang
- 日本：富士山、熊野古道、北阿尔卑斯纵走
- 欧洲：TMB 环勃朗峰、Tour du Mont Blanc 全程、AV1 多洛米蒂 Alta Via 1、West Highland Way、Camino de Santiago 最后100km
- 南美：Inca Trail 印加古道、Torres del Paine W Trek、Patagonia O Circuit
- 非洲：Kilimanjaro Marangu Route、Mt Kenya
- 北美：John Muir Trail、Pacific Crest Trail 精华段、Yosemite Half Dome
- 东南亚：Mt Kinabalu、Mt Rinjani

每条包含：name_zh、name_en、country_or_region、mode、distance_km、elevation_gain_m、max_altitude_m、start_poi、end_poi、duration_days、best_season、risk_tags、water_points、retreat_points、confidence_grade

输出文件：`international_routes_v6.json`

---

## 任务五：难度等级体系

所有89+30=119条线路，按统一标准定难度：

| 等级 | 标签 | 徒步标准 | 骑行标准 | 登山标准 |
|------|------|---------|---------|---------|
| 1 | 初级 | <10km, <500m爬升, 成熟步道 | <50km, 平路为主 | 无需技术装备, <5000m |
| 2 | 中级 | 10-20km, 500-1200m爬升 | 50-120km, 有起伏 | 需冰爪/冰镐, 5000-6000m |
| 3 | 高级 | 20-35km, 1200-2000m爬升 | 120-200km, 连续爬升 | 技术路线, 6000-7000m |
| 4 | 专家 | >35km, >2000m爬升或无人区 | >200km或高海拔 | 高难度技术攀登, >7000m |
| 5 | 极限 | 多日无人区或极端地形 | 极端环境 | 8000m级或极端技术路线 |

每条标注 `difficulty_level: 1-5` + `difficulty_reason`（一句话理由）。

输出文件：`difficulty_ratings_v6.json`

---

## 任务六：紧急救援信息

这是"专业"的分水岭。每条国内线路标注：
- 最近医院/卫生院（名称+坐标）
- 最近可通车的公路点
- 有信号的区域（移动/电信/联通分别标注）
- 当地救援队或景区管理处电话（如有）

国外线路标注：
- 最近城镇+医疗点
- 是否需要直升机救援（是/否）
- 当地紧急号码

输出文件：`emergency_info_v6.json`

---

## 任务七：海拔剖面数据

30 条核心线路（同一批 GPX 线路），每 500m 距离取一个海拔采样点，生成 `[距离km, 海拔m]` 数组。

格式示例：
```json
{
  "route_id": "hk_001",
  "elevation_profile": [[0, 3200], [0.5, 3280], [1.0, 3350], ...]
}
```

最少 10 个采样点。来源标注（GPX 解析 / DEM 估算 / 公开攻略）。

输出文件：`elevation_profiles_v6.json`

---

## 任务八：骑行路线深度补充（原任务五，编号后移）

29条骑行路线目前只有道路运营信息。需要补：

- 86个骑行 POI 校对（一个坐标一个坐标验）
- 每条路线的 surface_mix（路面比例，如"柏油60%+碎石25%+土路15%"）
- crosswind_exposure（横风暴露等级：低/中/高）
- 补给间隔 按 50km 为界打分（充足/一般/不足）

输出文件：`cycling_deepening_v6.json`

---

## 输出清单

全部放到 `data/inbox/2026-05-24/leo-routes/` 下：

| # | 文件 | 任务 |
|---|------|------|
| 1 | route_verification_v6.json | 89条字段校对 |
| 2 | gpx_links_v6.json | 30条核心 GPX 链接 |
| 3 | season_water_retreat_v6.json | 季节水源撤退补全 |
| 4 | international_routes_v6.json | 30条国外线路 |
| 5 | difficulty_ratings_v6.json | 119条难度评级 |
| 6 | emergency_info_v6.json | 紧急救援信息 |
| 7 | elevation_profiles_v6.json | 30条海拔剖面 |
| 8 | cycling_deepening_v6.json | 骑行深度补充 |
| 9 | leo_v6_qa.md | 自检报告 |

---

## 原则

1. 坐标超过 5km 偏差不叫"校对"叫"重做"
2. 所有字段不能留"待核验"——宁可写"资料不足"并标原因
3. GPX 找不到的标注 `unavailable_reason`，不编造链接
4. 国外线路标注信息来源和置信度
