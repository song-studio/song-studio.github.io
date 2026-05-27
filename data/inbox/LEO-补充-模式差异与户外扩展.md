# Leo 补充说明：三种模式的数据差异 + 户外扩展评估

> 下发时间：2026-05-24
> 配合 LEO-路线校对任务书.md 一起读

---

## 一、三种模式各自必需字段

### 徒步（hiking）

每段（segment）必须包含：
- from_name / to_name
- distance_km
- elevation_gain_m / elevation_loss_m
- estimated_hours
- road_condition（石板路/土路/碎石/丛林/雪线以上）
- signpost_quality（清晰/模糊/无）
- water_available（有水源/无水源/季节性）
- retreat_possible（可撤退/困难/无撤退）

必须覆盖率：≥ 80% 的徒步线路

### 骑行（cycling）

与徒步完全不同。核心字段：
- surface_mix（路面比例：柏油/水泥/碎石/土路）
- road_classes（国道/省道/县道/乡道/专用道）
- traffic_level（低/中/高）
- shoulder_width（路肩宽度，影响安全）
- elevation_profile_type（起伏/持续爬升/平路）
- crosswind_exposure（横风暴露等级）
- resupply_interval_km（补给间隔）
- repair_points（维修点）
- tunnel_sections（隧道段数/总长/是否有灯）

必须覆盖率：≥ 80% 的骑行线路

### 登山（mountaineering）

与徒步/骑行完全不同。核心字段：
- basecamp（BC 名称/坐标/海拔）
- camps（C1/C2/C3 名称/坐标/海拔）
- summit_coords（顶峰坐标，比路线终点更精确）
- technical_grade（技术等级：PD/AD/D/TD/ED 或中国标准）
- terrain_type（冰川/岩壁/雪坡/混合）
- required_gear（冰镐/冰爪/安全带/主绳/雪锥…）
- summit_push_start_time（冲顶出发时间，通常凌晨2-4点）
- turnaround_time（强制折返时间，通常12:00-14:00）
- weather_abort_thresholds（天气红线）
- glacier_hazard（冰裂缝/雪崩风险/冰崩）

必须覆盖率：≥ 90% 的登山线路

---

## 二、骑行拆分为"自行车"和"摩旅"

目前数据里已有 mode 区分：
- cycling → 自行车骑行
- 摩旅 → 需要单独标注 mode: "motorcycle"

建议：
1. 现有 21 条 cycling + 12 条摩旅 → 重新分类，确认每条的 mode 正确
2. 自行车和摩旅的数据差异：
   - 摩旅不需要路肩宽度/维修点（车行维修）
   - 摩旅需要加油站/住宿/封路信息
   - 自行车需要坡度分段/补给点/驮包存放

3. 补充几条经典摩旅线：
   - 丙察察（云南→西藏）
   - 317 川藏北线
   - 219 新藏线
   - 泸亚线（泸沽湖→亚丁）
   - 香格里拉大环线

---

## 三、其他户外活动评估

现有 other_outdoor_catalog_v3.json 48 条。覆盖：

| 活动 | 现有条数 | 建议 |
|------|---------|------|
| 越野跑 | ~5 | 暂不独立，归入徒步 |
| 攀岩/抱石 | ~8 | 数据维度差异太大，独立页面，先不做 |
| 漂流/皮划艇 | ~6 | 同上 |
| 滑翔伞 | ~3 | 同上 |
| 飞拉达 | ~3 | 同上 |
| 登山滑雪 | ~4 | 可标注在登山线路的"冬季变体" |
| 洞穴 | ~3 | 暂不做 |
| 其他 | ~16 | 保留在 catalog，不扩展 |

**结论：不新增 UI 模式。48 条 catalog 保留用于未来扩展。**
---

## 四、校验标准

每条线路完成校对后打分：
- A 级（可发布）：核心字段全，坐标经验证，有 GPX 或等效关键点
- B 级（可显示）：核心字段完整，坐标有来源但未验证
- C 级（仅参考）：部分字段缺，但基本信息可用
- D 级（下线）：数据不足，标注"待补充"并从主列表隐藏

目标：A+B ≥ 70%
