#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = path.join(root, 'index.html');
const matchesPath = path.join(root, 'data/matches.json');
const standingsPath = path.join(root, 'data/standings.json');
const cardsPath = path.join(root, 'data/cards.json');
const asOf = '2026-06-27T11:00:00+08:00';
const todayBjt = '2026-06-27';

const index = fs.readFileSync(indexPath, 'utf8');
const start = index.indexOf('const G=');
const end = index.indexOf('\n\nconst TEAMS=', start);
if (start < 0 || end < 0) throw new Error('无法从 index.html 读取小组赛程');
const context = {};
vm.createContext(context);
vm.runInContext(`${index.slice(start, end).replace('const G=', 'G=')};`, context);
const schedule = context.G;

const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
const byName = new Map(cards.teams.filter(team => team.qualified).map(team => [team.name, team]));
const aliases = new Map([
  ['沙特', '沙特阿拉伯'],
]);
const cardFor = name => {
  const team = byName.get(aliases.get(name) || name);
  if (!team) throw new Error(`cards.json 中没有球队：${name}`);
  return team;
};

// 赛果逐场与 FIFA 官方赛程页、Sky Sports 赛果页核对；截至北京时间 6 月 27 日 11:00。
const results = {
  'group-a-m1':[2,0], 'group-a-m2':[2,1], 'group-a-m3':[1,1], 'group-a-m4':[1,0], 'group-a-m5':[0,3], 'group-a-m6':[1,0],
  'group-b-m1':[1,1], 'group-b-m2':[1,1], 'group-b-m3':[4,1], 'group-b-m4':[6,0], 'group-b-m5':[2,1], 'group-b-m6':[3,1],
  'group-c-m1':[1,1], 'group-c-m2':[0,1], 'group-c-m3':[0,1], 'group-c-m4':[3,0], 'group-c-m5':[0,3], 'group-c-m6':[4,2],
  'group-d-m1':[4,1], 'group-d-m2':[2,0], 'group-d-m3':[2,0], 'group-d-m4':[0,1], 'group-d-m5':[3,2], 'group-d-m6':[0,0],
  'group-e-m1':[7,1], 'group-e-m2':[1,0], 'group-e-m3':[2,1], 'group-e-m4':[0,0], 'group-e-m5':[2,1], 'group-e-m6':[0,2],
  'group-f-m1':[2,2], 'group-f-m2':[5,1], 'group-f-m3':[4,0], 'group-f-m4':[5,1], 'group-f-m5':[1,1], 'group-f-m6':[1,3],
  'group-g-m1':[1,1], 'group-g-m2':[2,2], 'group-g-m3':[0,0], 'group-g-m4':[1,3],
  'group-h-m1':[0,0], 'group-h-m2':[1,1], 'group-h-m3':[4,0], 'group-h-m4':[2,2], 'group-h-m5':[0,0], 'group-h-m6':[0,1],
  'group-i-m1':[3,1], 'group-i-m2':[1,4], 'group-i-m3':[3,0], 'group-i-m4':[3,2], 'group-i-m5':[1,4], 'group-i-m6':[5,0],
  'group-j-m1':[3,0], 'group-j-m2':[3,1], 'group-j-m3':[2,0], 'group-j-m4':[1,2],
  'group-k-m1':[1,1], 'group-k-m2':[1,3], 'group-k-m3':[5,0], 'group-k-m4':[1,0],
  'group-l-m1':[4,2], 'group-l-m2':[1,0], 'group-l-m3':[0,0], 'group-l-m4':[0,1],
};

const toDate = value => {
  const match = /^(\d+)月(\d+)日$/.exec(value);
  if (!match) throw new Error(`无法解析日期：${value}`);
  return `2026-${String(match[1]).padStart(2, '0')}-${String(match[2]).padStart(2, '0')}`;
};

const matches = [];
for (const [group, groupData] of Object.entries(schedule)) {
  groupData.matches.forEach((match, indexNumber) => {
    const id = `group-${group.toLowerCase()}-m${indexNumber + 1}`;
    const home = cardFor(match.h.n);
    const away = cardFor(match.a.n);
    const score = results[id];
    const item = {
      id,
      stage: 'group',
      group,
      home: home.name,
      away: away.name,
      homeEn: home.englishName,
      awayEn: away.englishName,
      homeId: home.id,
      awayId: away.id,
      date: toDate(match.d),
      time: match.t,
      timezone: 'Asia/Shanghai',
      venue: match.v,
      city: match.c,
      status: score ? 'finished' : 'scheduled',
    };
    if (score) {
      item.homeScore = score[0];
      item.awayScore = score[1];
      item.winner = score[0] > score[1] ? 'home' : score[0] < score[1] ? 'away' : 'draw';
    }
    matches.push(item);
  });
}

const matchesData = {
  updatedAt: '2026-06-27',
  asOf,
  timezone: 'Asia/Shanghai',
  mode: 'manual-results-feed',
  note: 'matches 保存 72 场完整小组赛；today 只保存北京时间当天比赛，供球迷卡牌赛预测。winner: home=主胜、away=客胜、draw=平局。',
  sources: [
    {
      name: 'FIFA World Cup 2026 fixtures and results',
      url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums',
    },
    {
      name: 'Sky Sports World Cup results',
      url: 'https://www.skysports.com/football/competitions/world-cup/results/world-cup-scores-fixtures',
    },
  ],
  today: matches.filter(match => match.date === todayBjt),
  matches,
};

const standings = {};
for (const [group, groupData] of Object.entries(schedule)) {
  const originalOrder = new Map(groupData.teams.map((team, indexNumber) => [cardFor(team.n).id, indexNumber]));
  const table = groupData.teams.map(team => {
    const card = cardFor(team.n);
    return { teamId: card.id, name: card.name, englishName: card.englishName, flag: card.flag, p:0, w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0 };
  });
  const rows = new Map(table.map(row => [row.teamId, row]));
  for (const match of matches.filter(item => item.group === group && item.status === 'finished')) {
    const home = rows.get(match.homeId);
    const away = rows.get(match.awayId);
    home.p += 1; away.p += 1;
    home.gf += match.homeScore; home.ga += match.awayScore;
    away.gf += match.awayScore; away.ga += match.homeScore;
    if (match.winner === 'home') { home.w += 1; home.pts += 3; away.l += 1; }
    else if (match.winner === 'away') { away.w += 1; away.pts += 3; home.l += 1; }
    else { home.d += 1; away.d += 1; home.pts += 1; away.pts += 1; }
  }
  table.forEach(row => { row.gd = row.gf - row.ga; });
  table.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || originalOrder.get(a.teamId) - originalOrder.get(b.teamId));
  table.forEach((row, indexNumber) => { row.position = indexNumber + 1; });
  standings[group] = table;
}

const standingsData = {
  updatedAt: '2026-06-27',
  asOf,
  stage: 'group-stage',
  tiebreakersImplemented: ['points', 'goalDifference', 'goalsFor', 'originalGroupOrder'],
  note: '自动排序范围：积分、净胜球、进球数；仍同分时保留原小组顺序。FIFA 后续相互战绩、公平竞赛积分和抽签规则未自动计算。',
  groups: standings,
};

fs.writeFileSync(matchesPath, `${JSON.stringify(matchesData, null, 2)}\n`);
fs.writeFileSync(standingsPath, `${JSON.stringify(standingsData, null, 2)}\n`);
console.log(`Wrote ${matches.length} matches (${Object.keys(results).length} finished) and 12 group tables.`);
