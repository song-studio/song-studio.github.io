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
const knockoutData = readJson('data/knockout.json');
const teamIds = new Set(cards.teams.filter(team => team.qualified).map(team => team.id));
const matches = matchesData.matches;
const matchStartsAt = match => `${match.date}T${match.time || '00:00'}:00+08:00`;
const isWithinTodayGameWindow = match => {
  const windowStart = matchesData.todayGameWindow?.date || matchesData.updatedAt;
  const windowEnd = matchesData.todayGameWindow?.includesEarlyMorningUntil || `${windowStart}T23:59:59+08:00`;
  const startsAt = matchStartsAt(match);
  return startsAt >= `${windowStart}T00:00:00+08:00` && startsAt <= windowEnd;
};

if (!Array.isArray(matches) || matches.length !== 72) {
  fail(`matches.json 必须包含 72 场完整小组赛，当前为 ${Array.isArray(matches) ? matches.length : 0}`);
} else {
  pass('matches.json 包含 72 场完整小组赛');
}

if (!Array.isArray(matchesData.today)) fail('matches.json 缺少 today 数组');
else {
  const knockoutFixtureIds = (knockoutData.rounds || []).flatMap(round => round.matches || []).map(match => `knockout-${match.id}`);
  const allIds = new Set([...(Array.isArray(matches) ? matches.map(match => match.id) : []), ...knockoutFixtureIds]);
  const invalidToday = matchesData.today.find(match => !allIds.has(match.id) || !isWithinTodayGameWindow(match));
  if (invalidToday) fail(`today 场次不在卡牌赛今日窗口内：${invalidToday.id}`);
  else pass(`matches.json 包含 ${matchesData.today.length} 场卡牌赛今日窗口比赛`);
}

const knockoutResults = matchesData.results || [];
if (!Array.isArray(knockoutResults)) fail('matches.json 的 results 必须是数组');
else if (knockoutResults.length !== 29) fail(`截至 7 月 15 日 09:00 应有 29 场淘汰赛完场，当前为 ${knockoutResults.length}`);
else if (knockoutResults.some(match => match.status !== 'finished' || !match.winner)) fail('淘汰赛 results 存在未完场或缺少 winner 的比赛');
else pass('matches.json 包含 16 场 32 强、8 场 16 强、4 场八强及 1 场半决赛结果');

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
  const unfinished = matches.filter(match => match.status !== 'finished');
  if (unfinished.length) fail(`小组赛已经结束，但仍有 ${unfinished.length} 场未标记完场：${unfinished.map(match => match.id).join(', ')}`);
  else pass('72 场小组赛均已完场');
}

const groups = standingsData.groups || {};
if (Object.keys(groups).length !== 12) fail(`standings.json 必须包含 12 组，当前为 ${Object.keys(groups).length}`);
else if (Object.values(groups).some(group => !Array.isArray(group) || group.length !== 4)) fail('每个积分榜必须包含 4 支球队');
else pass('standings.json 包含 12 组、每组 4 支球队');

const incompleteRows = Object.values(groups).flat().filter(row => row.p !== 3);
if (incompleteRows.length) fail(`最终积分榜仍有球队未完成 3 场比赛：${incompleteRows.map(row => row.teamId).join(', ')}`);
else pass('最终积分榜中每支球队均完成 3 场比赛');

const knockoutRounds = knockoutData.rounds;
if (!Array.isArray(knockoutRounds) || knockoutRounds.length !== 6) {
  fail(`knockout.json 必须包含 6 个淘汰赛阶段，当前为 ${Array.isArray(knockoutRounds) ? knockoutRounds.length : 0}`);
} else {
  const expectedRoundSizes = [16, 8, 4, 2, 1, 1];
  const invalidRound = knockoutRounds.find((round, indexNumber) => !Array.isArray(round.matches) || round.matches.length !== expectedRoundSizes[indexNumber]);
  if (invalidRound) fail(`淘汰赛阶段场次数量错误：${invalidRound.key}`);
  else pass('knockout.json 包含完整的 32 强至决赛赛程结构');
}

const roundOf32 = knockoutRounds?.[0]?.matches || [];
const roundOf32TeamIds = roundOf32.flatMap(match => [match.homeId, match.awayId]);
const invalidKnockoutTeam = roundOf32TeamIds.find(teamId => !teamIds.has(teamId));
if (invalidKnockoutTeam) fail(`32 强使用了 cards.json 中不存在的球队 ID：${invalidKnockoutTeam}`);
else if (roundOf32TeamIds.length !== 32 || new Set(roundOf32TeamIds).size !== 32) fail('32 强必须包含 32 支不重复球队');
else pass('32 强包含 32 支不重复且有效的球队');

const finishedRoundOf32 = roundOf32.filter(match => match.status === 'finished');
if (finishedRoundOf32.length !== 16) fail(`32 强应有 16 场完赛，当前为 ${finishedRoundOf32.length}`);
else if (finishedRoundOf32.some(match => !Array.isArray(match.qualifiedTeamIds) || !Array.isArray(match.eliminatedTeamIds))) fail('已完赛 32 强比赛缺少晋级或淘汰球队');
else pass('32 强 16 场赛果均含晋级与淘汰球队');

const roundOf16 = knockoutRounds?.[1]?.matches || [];
const roundOf16TeamIds = roundOf16.flatMap(match => [match.homeId, match.awayId]);
if (roundOf16TeamIds.some(teamId => !teamId)) fail('16 强对阵仍有未确认球队占位');
else if (roundOf16TeamIds.length !== 16 || new Set(roundOf16TeamIds).size !== 16) fail('16 强必须包含 16 支不重复球队');
else if ((knockoutData.roundOf16TeamIds || []).join(',') !== roundOf16TeamIds.join(',')) fail('roundOf16TeamIds 与 16 强对阵不一致');
else pass('16 强 8 场对阵已全部确认，包含 16 支不重复球队');

const finishedRoundOf16 = roundOf16.filter(match => match.status === 'finished');
if (finishedRoundOf16.length !== 8) fail(`16 强应有 8 场完赛，当前为 ${finishedRoundOf16.length}`);
else pass('16 强 8 场已全部完赛，赛果状态正确');

const confirmedQuarterFinals = (knockoutRounds?.[2]?.matches || []).filter(match => match.homeId && match.awayId);
if (confirmedQuarterFinals.length !== 4) fail(`应确认 4 场八强对阵，当前为 ${confirmedQuarterFinals.length}`);
else pass('八强 4 场对阵已全部确认');

const finishedQuarterFinals = (knockoutRounds?.[2]?.matches || []).filter(match => match.status === 'finished');
if (finishedQuarterFinals.length !== 4) fail(`八强应有 4 场完赛，当前为 ${finishedQuarterFinals.length}`);
else if (finishedQuarterFinals.some(match => !Array.isArray(match.qualifiedTeamIds) || !Array.isArray(match.eliminatedTeamIds))) fail('已完赛八强比赛缺少晋级或淘汰球队');
else pass('八强 4 场已全部完赛，赛果状态正确');

const confirmedSemiFinals = (knockoutRounds?.[3]?.matches || []).filter(match => match.homeId && match.awayId);
if (confirmedSemiFinals.length !== 2) fail(`应确认 2 场半决赛对阵，当前为 ${confirmedSemiFinals.length}`);
else pass('半决赛 2 场对阵已全部确认');

const finishedSemiFinals = (knockoutRounds?.[3]?.matches || []).filter(match => match.status === 'finished');
if (finishedSemiFinals.length !== 1) fail(`截至 7 月 15 日 09:00 应有 1 场半决赛完赛，当前为 ${finishedSemiFinals.length}`);
else if (finishedSemiFinals[0].id !== 101 || finishedSemiFinals[0].homeScore !== 0 || finishedSemiFinals[0].awayScore !== 2 || finishedSemiFinals[0].winner !== 'away') {
  fail('M101 半决赛赛果应为法国 0-2 西班牙，西班牙晋级');
} else {
  pass('M101 半决赛法国 0-2 西班牙已写入');
}

const thirdPlaceMatch = knockoutRounds?.[4]?.matches?.[0];
if (thirdPlaceMatch?.homeId !== 'france') fail('三四名赛应已写入 M101 败者法国');
else pass('法国已进入三四名赛占位');

const finalMatch = knockoutRounds?.[5]?.matches?.[0];
if (finalMatch?.homeId !== 'spain') fail('决赛应已写入 M101 胜者西班牙');
else pass('西班牙已进入决赛占位');

if (knockoutData.stage !== 'semi-finals') fail(`knockout.json stage 应为 semi-finals，当前为 ${knockoutData.stage}`);
else pass('knockout.json 已进入半决赛阶段');

const qualifiedIds = knockoutData.qualifiedTeamIds || [];
const qualifiedMismatch = qualifiedIds.length !== 32
  || qualifiedIds.some(teamId => !roundOf32TeamIds.includes(teamId))
  || roundOf32TeamIds.some(teamId => !qualifiedIds.includes(teamId));
if (qualifiedMismatch) fail('qualifiedTeamIds 与 32 强对阵不一致');
else pass('qualifiedTeamIds 与 32 强对阵一致');

if (process.exitCode) process.exit(process.exitCode);
console.log('World Cup data validation passed.');
