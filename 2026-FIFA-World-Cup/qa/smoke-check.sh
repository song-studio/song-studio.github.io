#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAN="$ROOT/fan-cards.html"
SHARE="$ROOT/share-card.html"
MATCHES="$ROOT/data/matches.json"
CARD_STATUS="$ROOT/data/card-status.json"
VALIDATOR="$ROOT/qa/validate-world-cup-data.mjs"

pass() { printf "✅ %s\n" "$1"; }
fail() { printf "❌ %s\n" "$1"; exit 1; }
check_contains() {
  local file="$1"; local pattern="$2"; local msg="$3"
  if grep -nF "$pattern" "$file" >/dev/null 2>&1; then
    pass "$msg"
  else
    fail "$msg"
  fi
}
check_contains_regex() {
  local file="$1"; local pattern="$2"; local msg="$3"
  if grep -nE "$pattern" "$file" >/dev/null 2>&1; then
    pass "$msg"
  else
    fail "$msg"
  fi
}

echo "== World Cup Fan Cards Smoke Check =="

# 1) Share relay page: mobile-safe
check_contains "$SHARE" "viewport-fit=cover" "中转页包含 viewport-fit=cover"
check_contains "$SHARE" "overflow-x:hidden" "中转页包含防横向溢出设置"

# 2) Core gameplay guards
check_contains "$FAN" "team.id==='china'" "彩蛋卡禁止设为主队（防误选）"
check_contains "$FAN" "const DAILY_OPEN_LIMIT = 3;" "每日开卡上限为 3"
check_contains_regex "$FAN" "function saveNarrativeAnswer\([^)]+source" "叙事提交函数支持移动端来源"
check_contains "$FAN" "function downloadCanvasPng" "奖励卡下载使用独立 PNG 导出函数"
check_contains "$FAN" "canvas.toBlob" "奖励卡下载优先使用 Blob，避免大图 dataURL 卡顿"

# 3) Mobile narrative form is truly interactive
check_contains "$FAN" "data-m-narrative-input" "移动端叙事区存在输入控件"
check_contains "$FAN" "saveNarrativeAnswer" "移动端叙事区存在提交按钮"
check_contains "$FAN" ",'mobile'" "移动端叙事区提交按钮携带 mobile 参数"

# 4) Prediction entry fallback / demo path exists
check_contains "$FAN" "function loadDemoMatchesForPractice" "存在预测演示加载函数"
check_contains "$FAN" "加载预测演示" "比赛日无数据时有演示入口按钮"

# 5) matches.json validity
if node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$MATCHES" >/dev/null 2>&1; then
  pass "matches.json 是合法 JSON"
else
  fail "matches.json 解析失败"
fi

TODAY_COUNT=$(node -e "const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(Array.isArray(d.today)?d.today.length:-1)" "$MATCHES")
if [[ "$TODAY_COUNT" -ge 0 ]]; then
  pass "matches.json today 字段存在（当前数量: ${TODAY_COUNT}）"
else
  fail "matches.json 缺少 today 数组"
fi

node - "$MATCHES" "$CARD_STATUS" <<'NODE'
const fs = require('fs');
const matches = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const status = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const fail = message => { console.error(message); process.exit(1); };
if (!matches.results.some(match => match.id === 'knockout-101' && match.homeScore === 0 && match.awayScore === 2 && match.winner === 'away')) {
  fail('缺少 M101 法国 0-2 西班牙半决赛赛果');
}
if (!matches.results.some(match => match.id === 'knockout-102' && match.homeScore === 1 && match.awayScore === 2 && match.winner === 'away')) {
  fail('缺少 M102 英格兰 1-2 阿根廷半决赛赛果');
}
if (!matches.results.some(match => match.id === 'knockout-103' && match.homeScore === 4 && match.awayScore === 6 && match.winner === 'away')) {
  fail('缺少 M103 法国 4-6 英格兰三四名赛果');
}
if (matches.today.length !== 1 || matches.today[0]?.id !== 'knockout-104' || matches.today[0]?.stage !== 'final') {
  fail('7/19 今日窗口应只包含西班牙 vs 阿根廷冠亚军决赛');
}
if (status.spain?.stage !== '决赛' || status.argentina?.stage !== '决赛' || status.france?.stage !== '第四名' || status.england?.stage !== '季军') {
  fail('卡牌状态未同步决赛待战 / 英格兰季军 / 法国第四');
}
NODE
pass "三四名比分、决赛预测窗口与卡牌状态同步"

# 6) Full schedule, standings, team IDs, scores, and inline script syntax
if node "$VALIDATOR"; then
  pass "世界杯完整赛程、积分榜与页面脚本校验通过"
else
  fail "世界杯完整数据校验失败"
fi

echo "== PASS: smoke check completed =="
