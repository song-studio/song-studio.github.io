#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const fail = message => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};
const pass = message => console.log(`PASS: ${message}`);

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...index.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
let scriptsValid = true;
scripts.forEach((match, indexNumber) => {
  try {
    new vm.Script(match[1], { filename: `index-inline-${indexNumber + 1}.js` });
  } catch (error) {
    scriptsValid = false;
    fail(`index.html 第 ${indexNumber + 1} 个内联脚本语法错误：${error.message}`);
  }
});
if (scriptsValid) pass(`index.html 的 ${scripts.length} 个内联脚本语法正确`);

const cards = readJson('data/cards.json');
const matchesData = readJson('data/matches.json');
const standingsData = readJson('data/standings.json');
const teamIds = new Set(cards.teams.filter(team => team.qualified).map(team => team.id));
const matches = matchesData.matches;

if (!Array.isArray(matches) || matches.length !== 72) {
  fail(`matches.json 必须包含 72 场完整小组赛，当前为 ${Array.isArray(matches) ? matches.length : 0}`);
} else {
  pass('matches.json 包含 72 场完整小组赛');
}

if (!Array.isArray(matchesData.today)) fail('matches.json 缺少 today 数组');
else {
  const allIds = new Set(Array.isArray(matches) ? matches.map(match => match.id) : []);
  const invalidToday = matchesData.today.find(match => !allIds.has(match.id) || match.date !== matchesData.updatedAt);
  if (invalidToday) fail(`today 场次不是完整赛程中的北京时间当日比赛：${invalidToday.id}`);
  else pass(`matches.json 包含 ${matchesData.today.length} 场北京时间今日比赛`);
}

if (Array.isArray(matches)) {
  const seen = new Set();
  for (const match of matches) {
    if (!match.id || seen.has(match.id)) fail(`比赛 ID 缺失或重复：${match.id || '(empty)'}`);
    seen.add(match.id);
    for (const field of ['homeId', 'awayId']) {
      if (!teamIds.has(match[field])) fail(`${match.id} 使用了 cards.json 中不存在的 ${field}：${match[field]}`);
    }
    if (match.status === 'finished') {
      if (!Number.isInteger(match.homeScore) || !Number.isInteger(match.awayScore)) {
        fail(`${match.id} 已完场但比分无效`);
        continue;
      }
      const expected = match.homeScore > match.awayScore ? 'home' : match.homeScore < match.awayScore ? 'away' : 'draw';
      if (match.winner !== expected) fail(`${match.id} winner 与比分不一致`);
    }
  }
  if (!process.exitCode) pass('比赛 ID、球队 ID、比分和 winner 一致');
}

const groups = standingsData.groups || {};
if (Object.keys(groups).length !== 12) fail(`standings.json 必须包含 12 组，当前为 ${Object.keys(groups).length}`);
else if (Object.values(groups).some(group => !Array.isArray(group) || group.length !== 4)) fail('每个积分榜必须包含 4 支球队');
else pass('standings.json 包含 12 组、每组 4 支球队');

if (process.exitCode) process.exit(process.exitCode);
console.log('World Cup data validation passed.');
