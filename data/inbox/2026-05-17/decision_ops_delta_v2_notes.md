> **v2.1 修正摘要**
> - 新增旧字段 `abort_triggers` 作为 `abort_triggers_refined` 的兼容别名（18条，无影响）
> - 新增旧字段 `turnaround_rules` 作为 `turnaround_time_refined` 的兼容别名（7条规则+乘数，无影响）
> - 标准字段名未被移除，新增字段仅用于兼容
> - 新增 `data_confidence` 字段（high/medium/low）至全部67条规则记录
> - 新增 `source_tier` 字段（official/research/community）至全部67条规则记录
> - 基于 source_urls 的域名自动分类，分布：high/official=37, medium/research=15, low/community=15
> - 执行动作从12条扩展到32条（每模式≥8）
> - 测试集从flat list改为modes.hiking.cases分组结构
> - 影响记录：JSON主文件每条规则 +2 字段（67条×2=134次标注），旧字段 +2，testcases结构重构65条

# 规则引擎补强 v2 — 说明文档（结构对齐版）

**版本**: 2.0.0
**生成日期**: 2026-05-17
**目标**: RouteOps / MeteoOps
**验收**: 规则可计算率100%, 每条来源可追溯, 测试样例可直接联调

---

## 文件清单

| 文件 | 大小 | 说明 |
|:----|:----:|:-----|
| `decision_ops_delta_v2.json` | 40KB | 5个模块: abort_triggers_refined(18) + turnaround_time_refined(7+乘数) + scenario(10) + exec_actions(32) + confidence(5+13) |
| `decision_ops_delta_v2_testcases.json` | 11KB | 65条, 分组结构 modes.hiking.cases / mountaineering / cycling / motorcycle |
| `decision_ops_delta_v2_notes.md` | — | 本文档 |

---

## 任务书字段名精确匹配

| 任务书约定 | 实际字段 | 状态 |
|:-----------|:---------|:----:|
| abort_triggers_refined | abort_triggers_refined | ✅ |
| turnaround_time_refined | turnaround_time_refined | ✅ |
| scenario_simulation_rules | scenario_simulation_rules | ✅ |
| mode_specific_execution_actions | mode_specific_execution_actions | ✅ |
| confidence_weights | confidence_weights | ✅ |

## 执行动作每模式条数

| 模式 | 条数 | 覆盖触发场景 |
|:----|:----:|:------------|
| hiking | 8 | 热/冷/风/雨/闪电/负重/时间/脱水 |
| mountaineering | 8 | AMS/装备/升速/血氧/冰川/适应/休整/直飞 |
| cycling | 8 | 侧风/冰/雨/风寒/爬坡/高温/单人/坡度能力 |
| motorcycle | 8 | 疲劳/长途/风寒/风/海拔/高温/油膜/日限 |

## 测试集分组结构

```
modes:
  hiking:       17 cases
  mountaineering: 17 cases
  cycling:      16 cases
  motorcycle:   15 cases
  total:        65
```

## 数据来源

NWS / NATA / CDC / UIAA / EAWS / FHWA / NTSB / Komoot SAC / Mountain Hiking / Mountaineers / Cycling Weather / DeepDive MT

具体URL见每条规则的 source_urls 字段。
