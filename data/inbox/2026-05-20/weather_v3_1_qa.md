# Neo v3.1 气象增量 QA 报告

> 审查时间：2026-05-20
> 审查范围：7个v3.1增量文件
> 定位：只做增量补强，不重做整批

---

## A. weather_mobile_layout_priority_v3_1.json

| 检查项 | 状态 |
|-------|------|
| section_id | ✅ 13个区块均有定义 |
| priority P0/P1/P2 | ✅ P0=5, P1=6, P2=1 |
| mobile_position | ✅ first_screen/meteogram/detail_grid/source_drawer |
| must_show_metrics | ✅ 全部有指定 |
| hide_on_first_screen | ✅ 明确哪些不在第一屏 |
| reason | ✅ 每项有布局理由 |

### 第一屏设计要点
- P0必显：当前气温+体感、风速+阵风、降水概率+降水量、雷暴风险、日出日落
- P0但放detail_grid：能见度（低于阈值自动上浮）
- P1放第一屏：日出日落（占用极少空间）
- 不占第一屏：云量、湿度、露点、气压、紫外线、数据来源

---

## B. weather_meteogram_layers_v3_1.json

### 必含图表覆盖
| 图层 | 状态 |
|------|------|
| 温度/体感 | ✅ temp_feels_like（line）|
| 降水概率/降水量 | ✅ precipitation_prob（bar）|
| 风速/阵风 | ✅ wind_speed_gust（line）|
| 云量 | ✅ cloud_cover（band，分低/中/高层）|
| 能见度 | ✅ visibility（line，红色阈值标记）|
| 气压 | ✅ pressure（line，变化趋势标注）|
| 湿度/露点 | ✅ humidity_dew（line，双线）|
| 风向 | ✅ wind_direction_barb（wind_barb）|

### 额外设计细节
- 每条有阅读提示（reading_tip）
- 指定手机端高度（mobile_height_px 60-140）
- 颜色角色定义（color_role）

---

## C. weather_geocode_fallbacks_v3_1.json

### 数量检查
| 要求 | 实际 | 状态 |
|------|------|------|
| ≥80条 | 87条 | ✅ |
| 必须覆盖11个地点 | 全部覆盖 | ✅ |

### 字段完整性
- query_zh、preferred_query、fallback_queries、manual_lat、manual_lng ✅
- 87条全部有manual_lat/manual_lng（坐标直查兜底）
- 来自v3已验证的坐标数据

### 兜底策略
- 中国地点（amap）→ 高德地理编码优先，坐标直查兜底
- 海外地点（open_meteo）→ Open-Meteo Geocoding优先，坐标兜底
- 无法查到地点（unknown/manual_reference）→ 直接手输坐标

---

## D. weather_metric_tooltips_v3_1.json

### 覆盖检查
| 要求 | 实际 | 状态 |
|------|------|------|
| 覆盖v3所有P0/P1指标 | 16条 | ✅ |
| P0全部 | temperature_current, temperature_apparent, wind_speed, wind_gust, precipitation_probability, precipitation_amount, thunderstorm_probability, visibility ✅ | ✅ |
| P1全部 | temperature_max, temperature_min, wind_direction, cloud_cover, relative_humidity, dew_point, pressure_msl, uv_index ✅ | ✅ |

### 字段完整性
- metric_id ✅
- short_label ✅
- tooltip_zh ✅
- expert_note ✅
- bad_reading_example ✅（多数有场景例子）
- source_urls ✅

### 文案检查
- ❌ 无`plain_language_explanations`字段错误（已从v3吸取教训）
- ✅ 无"适合出发/不适合出发"类文案
- ✅ 专业克制，手机端短提示

---

## E. weather_model_badges_v3_1.json

### 要求检查
| 要求 | 状态 |
|------|------|
| Open-Meteo=主源 | ✅ primary |
| Windy/Meteoblue=外部参考 | ✅ reference |
| 高德=定位+中国地点 | ✅ primary（用于地理编码，非气象主源）|
| 不写已接入API的假源 | ✅ ECMWF/GFS/ICON标注为通过Open-Meteo间接使用 |

### use_in_app分布
| 分类 | 数量 |
|------|------|
| primary | 5（Open-Meteo, ECMWF, GFS, ICON, 高德, Open-Meteo Geocoding）|
| reference | 3（Windy, Meteoblue, 中国天气网）|
| not_now | 5（和风,心知,Google,NWS,OpenWeather）|

---

## 全局质量

| 项目 | 状态 |
|------|------|
| 5个JSON全部UTF-8有效 | ✅ |
| 不写户外活动建议 | ✅ |
| 不写"适合/不适合出发" | ✅ |
| 基于v3已有数据做增量 | ✅ |
| 所有文件在指定目录 | ✅ |
