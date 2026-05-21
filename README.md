# Song Studio

> 个人工作室门户 — 气象查询 · 路线规划 · 世界杯数据 · AI Agent 接口

**[song-studio.github.io](https://song-studio.github.io)**

---

## 工具箱

| 工具 | 说明 |
|------|------|
| [气象山野](https://song-studio.github.io/weather-pro.html) | 面向城市、营地、山口、路线起点的专业气象查询。体感温度、阵风、能见度、露点、气压、24h 风险 |
| [路线决策台](https://song-studio.github.io/route-pro.html) | 徒步/骑行/登山户外线路判断。轨迹等级、补给、撤退、装备风险、沿线天气 |
| [2026 FIFA 世界杯](https://song-studio.github.io/2026-fifa-world-cup/) | 48 队 · 12 组 · 完整赛程 · 球迷卡牌对战 · 实时比分 |
| [F1 数据站](https://song-studio.github.io/racing/) | 赛程 · 积分 · 车手 · 车队 |

---

## MCP 接口 — AI Agent 可用

2026 世界杯数据通过 MCP (Model Context Protocol) 开放查询。Claude Code 或其他 AI Agent 可直接调用。

**Endpoint:** `http://106.53.69.124:5000/mcp.json`

```
{
  "endpoints": {
    "/api/teams":    "48 支球队详细信息",
    "/api/schedule": "完整赛程（72 场小组赛）",
    "/api/rivalry":  "球队历史对战数据"
  },
  "auth": false
}
```

### Agent 接入示例

配置 MCP 后直接用自然语言查询：

- "第三场小组赛是谁对谁？"
- "巴西队分在哪个组？"
- "巴西对阿根廷历史战绩怎么样？"
- "6月14号有哪些比赛？"

---

## 技术栈

纯静态站点，GitHub Pages 托管。HTML/CSS/JS 内联，零构建依赖。

世界杯数据后端部署于腾讯云，Flask + gunicorn，API 免认证开放。
