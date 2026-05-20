# 户外多模式决策规则库 v1（计算规则层）— 说明文档

**版本**: 1.0.0
**生成日期**: 2026-05-17
**生成方式**: V3挖（RESEARCH + SYNTHESIZE）
**服务目标**: Song Studio 路线决策台

---

## 一、概述

本规则库为 **Song Studio 路线决策台** 提供可直接编码的量化规则和阈值。覆盖四种户外模式：

1. **徒步（hiking）** — 日间徒步/越野行走，非技术性路线
2. **登山（mountaineering）** — 海拔>3000m的登山与高海拔徒步
3. **单车（cycling）** — 公路骑行和山地骑行
4. **摩托车（motorcycle）** — 公路骑行和长途摩旅

### 判定三档

| 等级 | 编码 | 含义 |
|------|------|------|
| 可执行 | feasible | 条件在安全范围内，可按计划进行 |
| 谨慎执行 | cautious | 存在一定风险，需调整计划或加强装备 |
| 不建议执行 | inadvisable | 条件超出安全阈值，建议取消或改期 |

---

## 二、数据来源

所有规则均基于以下权威来源（完整URL见JSON文件各条目）：

### 热风险
- **NWS Heat Index Chart** — 美国国家气象局热指数表
  - https://www.weather.gov/ffc/hichart
  - 四档：Caution (80-90°F) → Extreme Caution (90-105°F) → Danger (105-130°F) → Extreme Danger (>130°F)
- **WBGT 标准** — 美军/ACSM/NATA 湿球黑球温度标准
  - https://en.wikipedia.org/wiki/Wet-bulb_globe_temperature
  - 五级：最高级（≥32.2°C / 黑旗）= 取消所有户外活动

### 风寒风险
- **NWS Wind Chill** — 风寒效应国家标准
  - https://www.weather.gov/bou/windchill
  - 公式：35.74 + 0.6215T - 35.75(V^0.16) + 0.4275T(V^0.16)，适用T≤60°F
  - 冻伤阈值：风寒≤-25°F时15分钟内可能冻伤

### 风力
- **Beaufort 等级** — https://mountain-hiking.com/hike-safe-wind/
- **骑行风阈值** — https://weatherontheway.app/blog/weather-safety-thresholds-for-cyclists
- **摩托车风阈值** — https://ctinjurylawyers.com/when-is-the-weather-too-bad-for-riding-your-motorcycle/

### 海拔
- **CDC Yellow Book / WMS 指南** — 高海拔与AMS
  - https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/high-altitude-travel-and-altitude-illness.html
  - 核心规则：>3000m后每日升幅≤500m；每3-4天休整；每1000m加休整日
- **WMS 2024 海拔总结** — https://wms.org/magazine/magazine/1463/2024-Altitude-Summary/default.aspx

### 补水与营养
- **NATA 补液指南** — 0.8-1.2L/h。不超过1.5L/h（防低钠血症）
  - https://www.dhs.gov/sites/default/files/publications/21_0929_cbp_scale-hydration-chart.pdf
- **Skratch Labs 钠补充** — 300-2000mg/h 因出汗率而异
  - https://www.skratchlabs.com/blogs/blog/sweat-rate-vs-sodium-loss-rate
- **Bergfreunde 能耗数据** — https://www.bergfreunde.eu/calories-burned-calculator/

### 闪电安全
- **NWS 30/30 规则** — https://www.weather.gov/safety/lightning-sports
- **NATA 闪电安全** — https://www.nata.org/sites/default/files/2025-08/lightning_safety_for_athletics_and_recreation.pdf

---

## 三、各模式关键规则摘要

### 3.1 徒步（Hiking）

| 参数 | 可行 | 谨慎 | 不可行 |
|------|------|------|--------|
| 热指数(°C) | ≤32 | 32-41 | ≥41 |
| WBGT(°C) | ≤29.4 | 29.5-32.1 | ≥32.2 |
| 气温(°C) | >5 | -10~5 | <-10 |
| 风速(km/h) | ≤38 | 39-61 | ≥62 |
| 降水(mm/h) | ≤10 | 10.1-50 | >50 |
| 能见度(m) | ≥500 | 200-500 | <200 |
| 闪电规则 | — | 预报有雷暴 | 30/30触发 |

### 3.2 登山（Mountaineering）

额外海量特定规则：

**升速铁律（WMS/CDC）**：
- 海拔>3000m后，日增睡眠海拔 ≤500m
- 每3-4天一个休整日
- 每上升1000m额外加一个休整日
- 首日睡眠海拔：<2750m（低风险）、2750-3400m（中）、>3400m（高）

**AMS判定**（Lake Louise Score）：
- 头痛 + 至少1项（肠胃不适/疲劳/头晕/睡眠障碍）
- **中度AMS**：头剧痛+呕吐+乏力/协调障碍 → 立即下撤
- **HAPE**：干咳+静息呼吸困难+唇色发蓝 → 紧急下撤+就医
- **HACE**：意识混乱+共济失调 → 紧急下撤+地塞米松+氧气

**温度冻伤风险**：
- 海拔每升1000m气温降约6.5°C（标准大气递减率）

### 3.3 单车（Cycling）

额外注意：
- **侧风危险**：持续风>30km/h或阵风>50km/h时有侧翻风险，尤其开阔平原/桥梁/山脊路
- **风寒效应**：骑行速度增加有效风速，20km/h骑行体感约比静止低3-5°C
- **制动距离**：湿滑路面制动距离约增加100%
- **路面标线**：潮湿时极为湿滑，需绕行
- **结冰**：气温≤0°C+湿气→黑冰风险→取消

### 3.4 摩托车（Motorcycle）

额外注意：
- **风寒公式**：有效风速 = 骑行速度 + 自然风速。80km/h骑行+10km/h自然风=90km/h等效风速
  - 温度0°C+80km/h → 体感约-11°C
  - 温度-10°C+80km/h → 体感约-19°C（冻伤<5min）
- **侧风**：>55km/h禁止骑行（两轮极不稳定）
- **降水**：>15mm/h建议避雨。路面油膜（雨后第一小时最滑）需降速60%
- **疲劳管理**：连续骑行≤2小时，每2小时休息15分钟。单日≤400km或8小时
- **功率损失**：海拔每升1000m自然吸气发动机功率损失约10%

---

## 四、JSON 结构说明

### 主文件：decision_rules_v1.json

```
├── version             # 版本号
├── generated_date      # 生成日期 
├── grading_system      # 三级判定说明
└── modes
    ├── hiking             # 徒步
    │   ├── load_model     # 负荷模型（输入参数+公式+分档）
    │   ├── risk_model     # 风险模型（热/冷/风/降水/风暴/能见度）
    │   ├── altitude_model # 海拔模型（本模式不适用）
    │   ├── execution_rules# 执行规则（出发/折返/补水/能耗）
    │   └── gear_rules     # 装备规则（轻装/三季/寒冷高海拔）
    ├── mountaineering   # 登山（同上结构，含完整海拔模型）
    ├── cycling          # 单车
    └── motorcycle       # 摩托车
```

### 测试集：decision_rules_v1_testcases.json

```
├── total_testcases: 84
└── modes
    ├── hiking:         21 cases
    ├── mountaineering: 21 cases
    ├── cycling:        21 cases
    └── motorcycle:     21 cases
```

每条测试案例包含：
- `id` — 唯一标识（HIK/MNT/CYC/MOT-序号）
- `description` — 描述
- `inputs` — 输入参数
- `expected_grade` — 预期等级
- `expected_risk_factors` — 预期风险因素
- `test_category` — 测试类型（正常/边界值/热风险/寒风险/风风险/降水/风暴/海拔/AMS/组合风险/能见度）

---

## 五、使用建议

### 5.1 严格字段命名
所有JSON字段名必须精确匹配任务书规范，不可自行简写或修改：
- ✅ `heat_risk_thresholds`（不是 heat_risk）
- ✅ `cold_risk_thresholds`（不是 cold_risk）
- ✅ `wind_risk_thresholds`（不是 wind_risk）
- ✅ `precip_risk_thresholds`（不是 precip_risk）
- ✅ `light_kit` / `three_season_kit` / `cold_high_alt_kit`（名称固定）
- ✅ 每个 gear_rules 的 trigger 必须包含 temp/precip/wind/altitude 四个条件

### 5.2 编码实现
- `load_model.difficulty_score` 为0-100的连续分值，可直接用于UI进度条/颜色映射
- 各风险模型是独立的判定单元，最终等级取 **所有模型中的最差等级**
- 即：load_model=feasible 但 wind_risk_thresholds=inadvisable → 最终 = inadvisable
- 所有模式规则**完全独立**，不依赖跨模式引用

### 5.3 推荐计算逻辑
```
function getFinalGrade(mode, inputs):
    grades = []
    grades.push(getLoadGrade(mode, inputs))
    grades.push(getHeatGrade(mode, inputs))
    grades.push(getColdGrade(mode, inputs))
    grades.push(getWindGrade(mode, inputs))
    grades.push(getPrecipGrade(mode, inputs))
    grades.push(getStormGrade(mode, inputs))
    grades.push(getVisibilityGrade(mode, inputs))
    if mode == mountaineering:
        grades.push(getAltitudeGrade(inputs))
        grades.push(getAMSGrade(inputs))
    # 取最差等级
    return worstGrade(grades)
```

### 5.3 区域化热阈值
WBGT阈值应按区域调整（详见PerryWeather WBGT分类）：
- **Class 1**（北方/山区）：cutoff 29°C（84°F）
- **Class 2**（中纬度）：cutoff 31°C（88°F）
- **Class 3**（南方/沿海）：cutoff 32.3°C（90°F）

---

## 六、边界与局限

1. **个体差异未纳入**：年龄、健康状态、体能水平、AMS易感性等个体因素尚未建模
2. **未包含地形技术难度**：攀岩/冰川/岩壁等技术性路线的技术难度评分
3. **气候适应未量化**：已适应(acclimatized) vs 未适应个体的补偿因子
4. **海拔公式简化**：以标准大气递减率6.5°C/1000m为准，未计入逆温层例外
5. **摩托车功率损失**：涡轮增压发动机损失较小(~5%/1000m)，未单独区分
6. **AQI空气污染**：户外活动受空气污染影响，AQI>150时建议减少户外活动

---

## 七、变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-05-17 | 初版 — 四模式可计算规则库 |
