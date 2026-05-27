# Nova 路线数据接管任务书

> 下发时间：2026-05-24
> 产出目录：data/inbox/2026-05-24/nova-routes/
> 参考数据：data/processed/outdoor_routes_v5.json、data/inbox/2026-05-24/leo-routes/（仅参考已验证部分，不用信任）
> 背景：Leo 只完成了 33/101 条线路的基础验证，大量字段空缺。现由 Nova 全量接管，从头做。

---

## ⚠️ 分批执行规则（强制遵守）

**原因：101 条线路一次做完会撑爆上下文，导致会话崩溃、数据丢失。**

规则：
1. **每批最多 15 条线路**，做完一批存一个中间文件：`batch_01.json`、`batch_02.json`...直到 `batch_07.json`（7 批）
2. **每批做完立刻存盘**，不要等全部做完再存
3. **开新会话做下一批**——旧会话上下文已满，继续往里塞会崩
4. 7 批全部完成后，合并成 `route_full_verification_v6.json`
5. 格式示例：`batch_01.json` → `{ "batch": 1, "routes": [ { "route_id": "hk_001", ... }, ... ] }`

**线路分批表**（按 route_id 排序后均分，每批 14-15 条）：

---

## 任务一：101 条线路全量字段补全（最高优先级）

这是户外决策的核心——用户要看的不只是线路存在，而是**什么季节能走、路上有没有水、出事往哪撤**。

对 101 条线路逐条补全以下字段，**不能留"待核验"**：

| 字段 | 要求 | 查不到怎么写 |
|------|------|-------------|
| season_status | 最佳X月-Y月，可行X月-Y月，封闭X月-Y月 | "资料不足，建议咨询当地向导" |
| water_points | 不少于 2 个水源点名+大致位置 | "全程无水，需背水X升" 或 "资料不足" |
| retreat_points | 不少于 1 个撤退方案 | "沿途多处可下撤至公路" 或 "无撤退点，需原路返回" |
| risk_tags | 不少于 3 个风险标签 | 从通用风险中合理推断 |
| emergency_access_score | 良好/一般/困难/直升机 | 标注判断依据 |

查资料优先用：
- 两步路 (2bulu.com) 搜线路名 → 看游记/攻略
- 8264 (8264.com)
- 马蜂窝

**执行方式**：按上方分批规则，每批开新会话。最终合并文件为 `route_full_verification_v6.json`。

---

## 任务二：GPX 轨迹收集（目标 30 条核心线路）

在两步路 (2bulu.com) 搜索以下线路名，找真实轨迹页，记录链接：

**30 条目标线路**：
虎跳峡高路、雨崩、武功山、鳌太、墨脱、珠峰东坡、长穿毕、扎尕那、七藏沟、四姑娘山二峰、哈巴雪山、冈仁波齐转山、梅里外转、独库公路、318川藏南线、环青海湖、环海南岛、箭扣长城、南太行、徽杭古道、漓江徒步、稻城亚丁、他念他翁、乌孙古道、夏塔古道、喀纳斯环线、党岭、库拉岗日、希夏邦马、新藏线

每条标注：
- GPX/轨迹页链接（两步路分享页 URL 就行）
- 轨迹质量：A=多条成熟轨迹 B=有轨迹但少 C=找不到
- 找不到的标注原因（如"鳌太全面禁穿，无公开轨迹"）

输出文件：`gpx_links_v6.json`

---

## 任务三：补齐国外线路到 30 条

当前 7 条。补到 30 条。参考 Wikipedia + 英文攻略确认基础数据。

优先补：
- 尼泊尔：ACT 安娜普尔纳大环、Langtang
- 欧洲：AV1 多洛米蒂 Alta Via 1、West Highland Way、Camino de Santiago 最后100km
- 南美：Torres del Paine W Trek/O Circuit
- 北美：John Muir Trail、Yosemite Half Dome
- 非洲：Mt Kenya
- 东南亚：Mt Kinabalu、Mt Rinjani
- 日本：北阿尔卑斯纵走

每条包含：name_zh、name_en、country_or_region、mode、distance_km、elevation_gain_m、max_altitude_m、start_poi、end_poi、duration_days、best_season、region_scope: "global"

输出文件：`international_routes_v6.json`

---

## 任务四：骑行/摩旅深度数据

现有 21 条自行车 + 12 条摩旅。补全：

**自行车**：
- surface_mix（路面比例，如"柏油60%+碎石25%+土路15%"）
- shoulder_width（路肩：宽/窄/无）
- traffic_level（低/中/高）

**摩旅**：
- fuel_stops（加油站间隔/位置）
- road_closure_risk（封路风险：低/中/高，标注季节）
- accommodation（住宿点分布）

输出文件：`cycling_motorcycle_depth_v6.json`

---

## 任务五：紧急救援信息（全量 101+30=131 条）

这是"专业"的分水岭。国内线路标注：
- 最近医院/卫生院（名称+坐标）
- 最近可通车公路点
- 信号覆盖（移动/电信/联通分别标注）
- 当地救援电话（如有）

国外线路：
- 最近城镇+医疗点
- 当地紧急号码
- 是否需要直升机

输出文件：`emergency_info_v6.json`

---

## 任务六：自检报告

包含：
- 每条线路的置信度等级（A/B/C/D）
- A+B 占比目标 ≥ 70%
- 已知问题和建议
- 数据来源清单

输出文件：`nova_routes_v6_qa.md`

---

## 输出清单

全部放到 `data/inbox/2026-05-24/nova-routes/`：

| # | 文件 | 任务 |
|---|------|------|
| 1 | route_full_verification_v6.json | 101 条全量字段补全 |
| 2 | gpx_links_v6.json | 30 条核心 GPX |
| 3 | international_routes_v6.json | 国外线补到 30 条 |
| 4 | cycling_motorcycle_depth_v6.json | 骑行/摩旅深度 |
| 5 | emergency_info_v6.json | 131 条救援信息 |
| 6 | nova_routes_v6_qa.md | 自检报告 |

---

## 原则

1. 查不到就是查不到，写清楚原因，不编造
2. 每条标注信息来源（两步路搜索/8264/Wikipedia/攻略）
3. 不信任 Leo 的数据，全部从头验证
4. 国内坐标用高德 API（key: 39a8c2f6ef75e494198f3e3751701ebe），海外用 Open-Meteo geocoding
