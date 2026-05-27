# NOVA7 任务书：路线与气象决策质量复审

## 任务目标
这次不要再单纯扩充数量。目标是把「气象山野」和「路线决策台」做成和两步路、普通天气网站不一样的工具：别人给路线和天气，我们给户外行动判断。你需要复审旧数据和 v6 数据，找出可疑、重复、低质量、不够专业的部分，并补充能直接进入页面的决策字段。

## 工作目录
读取项目：`/Users/song/Desktop/Codex/song-studio.github.io/song-studio.github.io-work/`

重点读取：
- `data/processed/outdoor_routes_v5.json`
- `data/processed/outdoor_routes_v6.json`（如果存在）
- `data/processed/weather_console_v5.json`
- `data/processed/weather_console_v6.json`（如果存在）
- `data/inbox/2026-05-24/nova-routes/route_full_verification_v6.json`
- `data/inbox/2026-05-24/nova-weather/` 全目录

输出目录：
`/Users/song/Desktop/Codex/song-studio.github.io/song-studio.github.io-work/data/inbox/2026-05-24/nova7-review/`

请只把成果放到这个目录，不要散落到其他地方。

## 一、路线数据复审
请逐条检查路线，重点不是美化文字，而是判断它能不能作为专业决策数据使用。

### 1. 旧数据和 v6 数据对照
输出 `route_v5_v6_diff_audit.json`。

每条路线至少包含：
- `route_id_v5`
- `route_id_v6`
- `name_zh`
- `mode`
- `status`: `keep` / `merge` / `rename` / `remove_candidate` / `needs_manual_review`
- `reason`
- `field_conflicts`: 里程、海拔、起终点、模式、轨迹、季节、许可等冲突
- `recommended_final_fields`: 你建议最终采用的字段

特别注意：
- route_id 重复问题，例如 `mc_005`、`hk_013`、`hk_014` 这类冲突必须指出。
- v5 中有但 v6 漏掉的经典线不能直接删，要判断是否保留。
- 名称很泛、像段子、像营销词、没有明确点位的路线要标为 `remove_candidate`。

### 2. 真实轨迹与示意轨迹分级
输出 `route_track_truth_audit.json`。

每条路线标注：
- `track_grade_final`: `real_track` / `source_track` / `key_points` / `unverified`
- `can_navigate`: true / false
- `public_track_url`: 两步路、Wikiloc、AllTrails、OSM、官方 GPX 等可公开打开链接
- `source_name`
- `evidence_note`
- `user_warning_zh`: 给页面显示的短句，例如“关键点示意，不可直接导航”

要求：
- 不要假装有 GPX。没有真实轨迹就明确写 `key_points` 或 `unverified`。
- 国内优先查两步路、8264、官方景区公告、户外攻略。国外优先查 AllTrails、Wikiloc、国家公园官网、官方 GPX、OSM relation。
- 输出 30 条最应该优先补真实轨迹的线路清单。

### 3. 决策字段补强
输出 `route_decision_fields_v7.json`。

每条路线补以下页面可直接展示的字段：
- `decision_summary_zh`: 30 字以内，说明这条路线最核心的决策点。
- `go_no_go_factors`: 3-6 条，什么情况适合走，什么情况不该走。
- `best_window`: 最佳月份、日内窗口、避开时段。
- `hard_stop_rules`: 必须取消或下撤的红线。
- `permit_level`: `none` / `simple` / `strict` / `unclear`
- `permit_note_zh`
- `rescue_reality_zh`: 救援现实，不要写空话。
- `signal_reality_zh`: 信号现实。
- `water_reliability`: `high` / `medium` / `low` / `seasonal` / `unknown`
- `water_note_zh`
- `camping_reality_zh`
- `who_should_avoid_zh`: 哪类人不适合。

要求：
- 徒步、骑行、登山、摩旅字段要有差异，不要全都像同一模板。
- 摩旅重点：油站、封路、海拔、修车、住宿、检查站、无人区。
- 骑行重点：路肩、车流、横风、补给间隔、爬坡强度、维修点。
- 徒步重点：水源、撤退、营地、岔路、负重、导航难度。
- 登山重点：海拔适应、技术等级、营地、天气窗口、许可证、救援难度。

## 二、气象数据复审
输出 `weather_decision_quality_v7.json`。

### 1. 小地点坐标复审
检查 v6 的 127 个地点，标注：
- `query_zh`
- `display_name`
- `lat`
- `lng`
- `elevation_m`
- `confidence_final`: A/B/C/D
- `ambiguity_risk`: none / low / medium / high
- `recommended_query_zh`
- `review_note`

重点检查：
- 范围很大的地点，如独库公路、纳木错、赛里木湖、冈仁波齐、珠峰东坡。
- 同名地点，如党岭、莫干山、Zermatt 等。
- 高德可能返回售票处、县城、景区中心，而不是行动起点的地点。

### 2. 气象决策模块建议
输出 `weather_modules_v7.json`。

请给页面提供可直接使用的模块定义：
- `module_id`
- `module_title_zh`
- `what_user_gets`
- `metrics_used`
- `decision_rule_summary`
- `mobile_priority`: 1-10
- `copy_zh`: 页面短文案，不要废话

必须覆盖：
- 风/阵风
- 降水/降水概率
- 能见度/低云
- 露点/湿度
- 气压变化
- CAPE 雷暴
- 高海拔冷风险
- 日出日落与行动窗口

## 三、网站差异化建议
输出 `product_difference_v7.md`。

请回答：
1. 我们和两步路、AllTrails、普通天气 App、Windy/Meteoblue 最大不同是什么？
2. 哪些信息应该放在手机第一屏？
3. 哪些信息应该收起来，避免页面臃肿？
4. 哪些路线不适合进入正式库？
5. 哪些路线最值得做成“示范级详情页”？列 10 条。
6. 还缺哪些数据，需要下一轮采集？按优先级排序。

## 四、输出文件清单
请最终输出：
- `route_v5_v6_diff_audit.json`
- `route_track_truth_audit.json`
- `route_decision_fields_v7.json`
- `weather_decision_quality_v7.json`
- `weather_modules_v7.json`
- `product_difference_v7.md`
- `nova7_qa.md`

## 五、质量要求
- 不要编造来源。没有来源就写 `needs_manual_review`。
- 不要用“适合大多数人”“风景优美”这种空话。
- 每条建议都要能帮助用户做决定：去不去、何时去、怎么撤、带什么、风险在哪。
- 国内是重点，国外占小比例。国外只保留经典热门、资料可靠、对产品有示范价值的路线。
- 输出 JSON 必须能被 `JSON.parse` 直接读取。
