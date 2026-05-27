# Nova 气象数据校对与补全任务书

> 下发时间：2026-05-24
> 产出目录：data/inbox/2026-05-24/nova-weather/
> 参考数据：data/processed/weather_console_v5.json、data/inbox/2026-05-20/ 下所有 weather_ 开头文件

---

## 任务一：兜底坐标验证（87条 → 全部验一遍）

87个地点的 manual_lat/manual_lng，逐一过高德 API 验证。用这个参数调：

```
https://restapi.amap.com/v3/place/text?key=39a8c2f6ef75e494198f3e3751701ebe&keywords=地点名&offset=3
```

要求：
- 每条标注：坐标偏差（米）、是否修正、修正后坐标
- 偏差 > 2km 的必须修正
- 高德查不到的标注 `geocode_source: "manual_fallback"`
- 输出文件：`geocode_fallbacks_v6_verified.json`

---

## 任务二：补充小地点（+45个）

目前 87 个兜底。补充到 ≥130 个。

**国内 +30 个**（目标：国内全覆盖）：
- 华北：海坨山、小五台、箭扣长城、老掌沟、坝上、乌兰布统、库布齐沙漠
- 华东：徽杭古道、莫干山、雁荡山、太姥山、武夷山徒步起点
- 华南：漓江徒步起点、丹霞山、鼎湖山、七娘山、东西冲
- 西北：喀纳斯徒步起点、禾木、白哈巴、赛里木湖、夏塔古道起点
- 西南：梅里北坡起点、亚丁村、格聂、党岭、七藏沟沟口
- 东北：长白山北坡/西坡、雪乡、漠河北极村

**海外 +15 个**（经典线路起终点）：
- 尼泊尔：Lukla、Pokhara、Jomsom、Namche Bazaar
- 日本：富士山五合目、熊野古道中边路起点
- 欧洲：Chamonix、Zermatt、Grindelwald、Cortina d'Ampezzo
- 南美：Cusco（印加古道起点）、Torres del Paine入口
- 非洲：Moshi（Kilimanjaro起点）
- 东南亚：Kinabalu Park HQ

格式同 v5 的 geocode_fallbacks 结构。
输出文件：`geocode_fallbacks_v6_supplement.json`

---

## 任务三：雷暴模块数据准备

v5 有 `thunderstorm_probability` 字段（P0 优先级），但目前 UI 没接。需要确认：
- Open-Meteo 是否能稳定返回 CAPE 指数
- 如果不能，雷暴概率用什么数据源替代（Windy？Meteoblue？ECMWF ENS？）
- 制定雷暴概率的阈值体系：多少算 watch、多少算 danger

输出文件：`thunderstorm_data_source_v6.json`

---

## 任务四：确认每个小地点的歧义说明

87 + 45 = ~130 个地点，每个的 `ambiguity_note` 和 `display_name` 都要有人肉读一遍。
尤其注意：
- 同名不同地（如全国多个"党岭"、多个"雨崩"）
- 需加省/市前缀才能高德精确定位的
- 海外地点 Open-Meteo 中文搜索是否有效

输出文件：`ambiguity_notes_v6_verified.json`

---

## 输出清单

全部放到 `data/inbox/2026-05-24/nova-weather/` 下：

| # | 文件 | 任务 |
|---|------|------|
| 1 | geocode_fallbacks_v6_verified.json | 87条坐标验证结果 |
| 2 | geocode_fallbacks_v6_supplement.json | 45个新增地点 |
| 3 | thunderstorm_data_source_v6.json | 雷暴数据源方案 |
| 4 | ambiguity_notes_v6_verified.json | 歧义说明全量校对 |
| 5 | api_live_test_v6.json | 20个样本API实测 |
| 6 | location_elevations_v6.json | 130个地点海拔 |
| 7 | nova_v6_qa.md | 自检报告 |

---

## 任务五：API 实测验证（20个样本）

抽 20 个代表性地点，实测 Open-Meteo API 返回质量。尤其关注：
- 中国小地点（村庄/垭口/营地）API 能否正常返回
- 海外地点中文名 geocoding 成功率
- 海拔 3000m+ 的地点数据精度是否下降
- 逐小时数据是否完整（不能有大量缺失）

测试方法：用 curl 或浏览器直接调 API，记录返回的关键字段是否正常。

输出文件：`api_live_test_v6.json`

---

## 任务六：补齐每个地点的海拔

130 个地点每个标注海拔。原因是：气象指标里的山区修正规则（ELEV_001~003）依赖海拔数据——海拔每升高 1000m 气温约降 6.5°C，体感温度和霜冻风险都要基于海拔修正。

格式：`elevation_m: 3200`，来源标注（高德返回 / SRTM / 公开资料）。

输出文件：`location_elevations_v6.json`

---

## 原则

1. 坐标有来源，不编造
2. 每项标注置信度（高德验证A / 公开坐标B / 估算C）
3. 海外地点标注 geocoding 方式（Open-Meteo / 手输坐标）
4. 不确定的标注 `needs_manual_review: true`
