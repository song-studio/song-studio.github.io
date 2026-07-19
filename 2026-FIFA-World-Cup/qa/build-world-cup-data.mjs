#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = path.join(root, 'index.html');
const matchesPath = path.join(root, 'data/matches.json');
const standingsPath = path.join(root, 'data/standings.json');
const knockoutPath = path.join(root, 'data/knockout.json');
const cardsPath = path.join(root, 'data/cards.json');
const cardStatusPath = path.join(root, 'data/card-status.json');
const asOf = '2026-07-20T06:07:25+08:00';
const todayBjt = '2026-07-20';
const earlyMorningCutoffBjt = '06:00';

const index = fs.readFileSync(indexPath, 'utf8');
const start = index.indexOf('const G=');
const end = index.indexOf('\n\nconst TEAMS=', start);
if (start < 0 || end < 0) throw new Error('无法从 index.html 读取小组赛程');
const context = {};
vm.createContext(context);
vm.runInContext(`${index.slice(start, end).replace('const G=', 'G=')};`, context);
const schedule = context.G;

const translationsStart = index.indexOf('const TR=');
const translationsEnd = index.indexOf('\n\n/* ══ US EASTERN TIME CONVERSION', translationsStart);
if (translationsStart < 0 || translationsEnd < 0) throw new Error('无法从 index.html 读取淘汰赛模板');
vm.runInContext(`${index.slice(translationsStart, translationsEnd).replace('const TR=', 'TR=')};`, context);
const translations = context.TR;

const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
const byName = new Map(cards.teams.filter(team => team.qualified).map(team => [team.name, team]));
const byId = new Map(cards.teams.filter(team => team.qualified).map(team => [team.id, team]));
const aliases = new Map([
  ['沙特', '沙特阿拉伯'],
]);
const cardFor = name => {
  const team = byName.get(aliases.get(name) || name);
  if (!team) throw new Error(`cards.json 中没有球队：${name}`);
  return team;
};

// 赛果逐场与 FIFA、AP、Sky Sports 和 beIN 赛果页核对；截至北京时间 6 月 28 日 15:00。
const results = {
  'group-a-m1':[2,0], 'group-a-m2':[2,1], 'group-a-m3':[1,1], 'group-a-m4':[1,0], 'group-a-m5':[0,3], 'group-a-m6':[1,0],
  'group-b-m1':[1,1], 'group-b-m2':[1,1], 'group-b-m3':[4,1], 'group-b-m4':[6,0], 'group-b-m5':[2,1], 'group-b-m6':[3,1],
  'group-c-m1':[1,1], 'group-c-m2':[0,1], 'group-c-m3':[0,1], 'group-c-m4':[3,0], 'group-c-m5':[0,3], 'group-c-m6':[4,2],
  'group-d-m1':[4,1], 'group-d-m2':[2,0], 'group-d-m3':[2,0], 'group-d-m4':[0,1], 'group-d-m5':[3,2], 'group-d-m6':[0,0],
  'group-e-m1':[7,1], 'group-e-m2':[1,0], 'group-e-m3':[2,1], 'group-e-m4':[0,0], 'group-e-m5':[2,1], 'group-e-m6':[0,2],
  'group-f-m1':[2,2], 'group-f-m2':[5,1], 'group-f-m3':[4,0], 'group-f-m4':[5,1], 'group-f-m5':[1,1], 'group-f-m6':[1,3],
  'group-g-m1':[1,1], 'group-g-m2':[2,2], 'group-g-m3':[0,0], 'group-g-m4':[1,3], 'group-g-m5':[1,1], 'group-g-m6':[1,5],
  'group-h-m1':[0,0], 'group-h-m2':[1,1], 'group-h-m3':[4,0], 'group-h-m4':[2,2], 'group-h-m5':[0,0], 'group-h-m6':[0,1],
  'group-i-m1':[3,1], 'group-i-m2':[1,4], 'group-i-m3':[3,0], 'group-i-m4':[3,2], 'group-i-m5':[1,4], 'group-i-m6':[5,0],
  'group-j-m1':[3,0], 'group-j-m2':[3,1], 'group-j-m3':[2,0], 'group-j-m4':[1,2], 'group-j-m5':[3,3], 'group-j-m6':[1,3],
  'group-k-m1':[1,1], 'group-k-m2':[1,3], 'group-k-m3':[5,0], 'group-k-m4':[1,0], 'group-k-m5':[0,0], 'group-k-m6':[3,1],
  'group-l-m1':[4,2], 'group-l-m2':[1,0], 'group-l-m3':[0,0], 'group-l-m4':[0,1], 'group-l-m5':[0,2], 'group-l-m6':[2,1],
};

const toDate = value => {
  const match = /^(\d+)月(\d+)日$/.exec(value);
  if (!match) throw new Error(`无法解析日期：${value}`);
  return `2026-${String(match[1]).padStart(2, '0')}-${String(match[2]).padStart(2, '0')}`;
};

const addDays = (date, days) => {
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day + days));
  return parsed.toISOString().slice(0, 10);
};
const nextBjt = addDays(todayBjt, 1);
const isTodayGameWindowMatch = match => {
  if (match.date === todayBjt) return true;
  return match.date === nextBjt && match.time <= earlyMorningCutoffBjt;
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
  updatedAt: todayBjt,
  asOf,
  timezone: 'Asia/Shanghai',
  mode: 'manual-results-feed',
  note: 'matches 保存 72 场完整小组赛；results 保存已结束的淘汰赛；today 保存中国用户的卡牌赛今日窗口：北京时间当天比赛，以及次日 06:00 前开球的深夜/凌晨比赛。winner: home=主队晋级、away=客队晋级、draw=平局。',
  sources: [
    {
      name: 'FIFA World Cup 2026 fixtures and results',
      url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums',
    },
    {
      name: 'Sky Sports World Cup results',
      url: 'https://www.skysports.com/football/competitions/world-cup/results/world-cup-scores-fixtures',
    },
    {
      name: 'ESPN FIFA World Cup scoreboard',
      url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard',
    },
  ],
  today: [],
  todayGameWindow: {
    date: todayBjt,
    timezone: 'Asia/Shanghai',
    includesEarlyMorningUntil: `${nextBjt}T${earlyMorningCutoffBjt}:00+08:00`,
    note: '用于卡牌赛预测入口；中国晚间用户可提前预测次日清晨比赛。',
  },
  results: [],
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
  updatedAt: todayBjt,
  asOf,
  stage: 'group-stage',
  tiebreakersImplemented: ['points', 'goalDifference', 'goalsFor', 'originalGroupOrder'],
  note: '自动排序范围：积分、净胜球、进球数；仍同分时保留原小组顺序。FIFA 后续相互战绩、公平竞赛积分和抽签规则未自动计算。',
  groups: standings,
};

const roundKeys = ['round-of-32', 'round-of-16', 'quarter-finals', 'semi-finals', 'third-place', 'final'];
const roundOf32Pairs = [
  ['south-africa', 'canada'],
  ['germany', 'paraguay'],
  ['netherlands', 'morocco'],
  ['brazil', 'japan'],
  ['france', 'sweden'],
  ['ivory-coast', 'norway'],
  ['mexico', 'ecuador'],
  ['england', 'dr-congo'],
  ['united-states', 'bosnia-herzegovina'],
  ['belgium', 'senegal'],
  ['portugal', 'croatia'],
  ['spain', 'austria'],
  ['switzerland', 'algeria'],
  ['argentina', 'cabo-verde'],
  ['colombia', 'ghana'],
  ['australia', 'egypt'],
];

// Final scores verified through the tournament close on July 20 BJT. For shootouts, winner is
// the advancing team while homeScore/awayScore remain the match score.
const knockoutResults = new Map([
  [73, { homeScore:0, awayScore:1, winner:'away', decidedBy:'regular' }],
  [74, { homeScore:1, awayScore:1, winner:'away', decidedBy:'penalties', homeShootoutScore:3, awayShootoutScore:4 }],
  [75, { homeScore:1, awayScore:1, winner:'away', decidedBy:'penalties', homeShootoutScore:2, awayShootoutScore:3 }],
  [76, { homeScore:2, awayScore:1, winner:'home', decidedBy:'regular' }],
  [77, { homeScore:3, awayScore:0, winner:'home', decidedBy:'regular' }],
  [78, { homeScore:1, awayScore:2, winner:'away', decidedBy:'regular' }],
  [79, { homeScore:2, awayScore:0, winner:'home', decidedBy:'regular' }],
  [80, { homeScore:2, awayScore:1, winner:'home', decidedBy:'regular' }],
  [81, { homeScore:2, awayScore:0, winner:'home', decidedBy:'regular' }],
  [82, { homeScore:3, awayScore:2, winner:'home', decidedBy:'extra-time' }],
  [83, { homeScore:2, awayScore:1, winner:'home', decidedBy:'regular' }],
  [84, { homeScore:3, awayScore:0, winner:'home', decidedBy:'regular' }],
  [85, { homeScore:2, awayScore:0, winner:'home', decidedBy:'regular' }],
  [86, { homeScore:3, awayScore:2, winner:'home', decidedBy:'extra-time' }],
  [87, { homeScore:1, awayScore:0, winner:'home', decidedBy:'regular' }],
  [88, { homeScore:1, awayScore:1, winner:'away', decidedBy:'penalties', homeShootoutScore:2, awayShootoutScore:4 }],
  [89, { homeScore:0, awayScore:1, winner:'away', decidedBy:'regular' }],
  [90, { homeScore:0, awayScore:3, winner:'away', decidedBy:'regular' }],
  [91, { homeScore:1, awayScore:2, winner:'away', decidedBy:'regular' }],
  [92, { homeScore:2, awayScore:3, winner:'away', decidedBy:'regular' }],
  [93, { homeScore:0, awayScore:1, winner:'away', decidedBy:'regular' }],
  [94, { homeScore:1, awayScore:4, winner:'away', decidedBy:'regular' }],
  [95, { homeScore:3, awayScore:2, winner:'home', decidedBy:'regular' }],
  [96, { homeScore:0, awayScore:0, winner:'home', decidedBy:'penalties', homeShootoutScore:4, awayShootoutScore:3 }],
  [97, { homeScore:2, awayScore:0, winner:'home', decidedBy:'regular' }],
  [98, { homeScore:2, awayScore:1, winner:'home', decidedBy:'regular' }],
  [99, { homeScore:1, awayScore:2, winner:'away', decidedBy:'extra-time' }],
  [100, { homeScore:3, awayScore:1, winner:'home', decidedBy:'extra-time' }],
  [101, { homeScore:0, awayScore:2, winner:'away', decidedBy:'regular' }],
  [102, { homeScore:1, awayScore:2, winner:'away', decidedBy:'regular' }],
]);

const scheduleOverrides = new Map([
  [91, { dateLabelZh:'7/6 周一', dateLabelEn:'Mon 7/6', timeBjt:'04:00', edtLabel:'Sun 7/5 16:00' }],
  [92, { dateLabelZh:'7/6 周一', dateLabelEn:'Mon 7/6', timeBjt:'09:00', edtLabel:'Sun 7/5 21:00' }],
  [93, { dateLabelZh:'7/7 周二', dateLabelEn:'Tue 7/7', timeBjt:'03:00', edtLabel:'Mon 7/6 15:00' }],
  [94, { dateLabelZh:'7/7 周二', dateLabelEn:'Tue 7/7', timeBjt:'08:00', edtLabel:'Mon 7/6 20:00' }],
  [95, { dateLabelZh:'7/8 周三', dateLabelEn:'Wed 7/8', timeBjt:'00:00', edtLabel:'Tue 7/7 12:00' }],
]);

const knockoutRounds = roundKeys.map((key, roundIndex) => {
  const zhStage = translations.zh.ko_stages[roundIndex];
  const enStage = translations.en.ko_stages[roundIndex];
  const zhMatches = translations.zh.ko_matches[roundIndex];
  const enMatches = translations.en.ko_matches[roundIndex];
  return {
    key,
    nameZh: translations.zh.ko_rounds[roundIndex],
    nameEn: translations.en.ko_rounds[roundIndex],
    dateZh: zhStage[1],
    dateEn: enStage[1],
    descriptionZh: zhStage[2],
    descriptionEn: enStage[2],
    matches: zhMatches.map((match, matchIndex) => {
      const englishMatch = enMatches[matchIndex];
      const matchId = match.m === '3rd' ? 103 : match.m === '🏆' ? 104 : match.m;
      const item = {
        id: matchId,
        stage: key,
        dateLabelZh: match.d,
        dateLabelEn: englishMatch.d,
        timeBjt: match.t,
        edtLabel: englishMatch.e,
        venue: match.v,
        cityZh: match.c,
        cityEn: englishMatch.c,
        status: 'scheduled',
      };
      if (roundIndex === 0) {
        const [homeId, awayId] = roundOf32Pairs[matchIndex];
        const home = byId.get(homeId);
        const away = byId.get(awayId);
        if (!home || !away) throw new Error(`32 强球队 ID 无效：${homeId} / ${awayId}`);
        Object.assign(item, {
          homeId,
          awayId,
          homeZh: home.name,
          awayZh: away.name,
          homeEn: home.englishName,
          awayEn: away.englishName,
        });
      } else {
        item.homePlaceholderZh = match.t1;
        item.awayPlaceholderZh = match.t2;
        item.homePlaceholderEn = englishMatch.t1;
        item.awayPlaceholderEn = englishMatch.t2;
      }
      return item;
    }),
  };
});

knockoutRounds.flatMap(round => round.matches).forEach(match => {
  const override = scheduleOverrides.get(match.id);
  if (override) Object.assign(match, override);
});

const applyKnownResult = match => {
  const result = knockoutResults.get(match.id);
  if (!result || !match.homeId || !match.awayId) return;
  const qualifiedTeamId = result.winner === 'home' ? match.homeId : match.awayId;
  const eliminatedTeamId = result.winner === 'home' ? match.awayId : match.homeId;
  Object.assign(match, result, {
    status: 'finished',
    qualifiedTeamIds: [qualifiedTeamId],
    eliminatedTeamIds: [eliminatedTeamId],
  });
};

const roundOf32 = knockoutRounds[0].matches;
roundOf32.forEach(applyKnownResult);
const winnerByMatchId = new Map(roundOf32.filter(match => match.status === 'finished').map(match => [match.id, match.qualifiedTeamIds[0]]));
const loserByMatchId = new Map(roundOf32.filter(match => match.status === 'finished').map(match => [match.id, match.eliminatedTeamIds[0]]));
const roundOf16Sources = [[74,77],[73,75],[76,78],[79,80],[83,84],[81,82],[86,88],[85,87]];
knockoutRounds[1].matches.forEach((match, matchIndex) => {
  const [homeSource, awaySource] = roundOf16Sources[matchIndex];
  const assignTeam = (side, sourceId) => {
    const teamId = winnerByMatchId.get(sourceId);
    if (!teamId) return;
    const team = byId.get(teamId);
    match[`${side}Id`] = teamId;
    match[`${side}Zh`] = team.name;
    match[`${side}En`] = team.englishName;
  };
  assignTeam('home', homeSource);
  assignTeam('away', awaySource);
});

const roundOf16 = knockoutRounds[1].matches;
roundOf16.forEach(applyKnownResult);
roundOf16.filter(match => match.status === 'finished').forEach(match => {
  winnerByMatchId.set(match.id, match.qualifiedTeamIds[0]);
  loserByMatchId.set(match.id, match.eliminatedTeamIds[0]);
});
const quarterFinalSources = [[89,90],[93,94],[91,92],[95,96]];
knockoutRounds[2].matches.forEach((match, matchIndex) => {
  const [homeSource, awaySource] = quarterFinalSources[matchIndex];
  const assignTeam = (side, sourceId) => {
    const teamId = winnerByMatchId.get(sourceId);
    if (!teamId) return;
    const team = byId.get(teamId);
    match[`${side}Id`] = teamId;
    match[`${side}Zh`] = team.name;
    match[`${side}En`] = team.englishName;
  };
  assignTeam('home', homeSource);
  assignTeam('away', awaySource);
});

const quarterFinals = knockoutRounds[2].matches;
quarterFinals.forEach(applyKnownResult);
quarterFinals.filter(match => match.status === 'finished').forEach(match => {
  winnerByMatchId.set(match.id, match.qualifiedTeamIds[0]);
  loserByMatchId.set(match.id, match.eliminatedTeamIds[0]);
});
const semiFinalSources = [[97,98],[99,100]];
knockoutRounds[3].matches.forEach((match, matchIndex) => {
  const [homeSource, awaySource] = semiFinalSources[matchIndex];
  const assignTeam = (side, sourceId) => {
    const teamId = winnerByMatchId.get(sourceId);
    if (!teamId) return;
    const team = byId.get(teamId);
    match[`${side}Id`] = teamId;
    match[`${side}Zh`] = team.name;
    match[`${side}En`] = team.englishName;
  };
  assignTeam('home', homeSource);
  assignTeam('away', awaySource);
});

const semiFinals = knockoutRounds[3].matches;
semiFinals.forEach(applyKnownResult);
semiFinals.filter(match => match.status === 'finished').forEach(match => {
  winnerByMatchId.set(match.id, match.qualifiedTeamIds[0]);
  loserByMatchId.set(match.id, match.eliminatedTeamIds[0]);
});

const assignKnockoutTeam = (match, side, teamId) => {
  if (!match || !teamId) return;
  const team = byId.get(teamId);
  if (!team) return;
  match[`${side}Id`] = teamId;
  match[`${side}Zh`] = team.name;
  match[`${side}En`] = team.englishName;
};
const thirdPlaceMatch = knockoutRounds[4].matches[0];
assignKnockoutTeam(thirdPlaceMatch, 'home', loserByMatchId.get(101));
assignKnockoutTeam(thirdPlaceMatch, 'away', loserByMatchId.get(102));
Object.assign(thirdPlaceMatch, {
  status: 'finished',
  homeScore: 4,
  awayScore: 6,
  winner: 'away',
  decidedBy: 'regular',
  qualifiedTeamIds: ['england'],
  eliminatedTeamIds: ['france'],
});
const finalMatch = knockoutRounds[5].matches[0];
assignKnockoutTeam(finalMatch, 'home', winnerByMatchId.get(101));
assignKnockoutTeam(finalMatch, 'away', winnerByMatchId.get(102));
Object.assign(finalMatch, {
  status: 'finished',
  homeScore: 1,
  awayScore: 0,
  winner: 'home',
  decidedBy: 'extra-time',
  qualifiedTeamIds: ['spain'],
  eliminatedTeamIds: ['argentina'],
});

const allKnockoutMatches = knockoutRounds.flatMap(round => round.matches);
const currentMatchIdsByTeam = new Map();
for (const match of allKnockoutMatches.filter(match => match.status !== 'finished' && (match.homeId || match.awayId))) {
  if (match.homeId) currentMatchIdsByTeam.set(match.homeId, match.id);
  if (match.awayId) currentMatchIdsByTeam.set(match.awayId, match.id);
}
const statusForStage = stage => {
  if (stage === 'round-of-32') return { stage:'32强', state:'止步32强', badge:'淘汰', alive:false };
  if (stage === 'round-of-16') return { stage:'16强', state:'止步16强', badge:'淘汰', alive:false };
  if (stage === 'quarter-finals') return { stage:'八强', state:'止步八强', badge:'淘汰', alive:false };
  if (stage === 'semi-finals') return { stage:'三四名赛', state:'待战季军赛', badge:'季军赛', alive:true };
  if (stage === 'third-place') return { stage:'第四名', state:'获得第四名', badge:'殿军', alive:false };
  if (stage === 'final') return { stage:'决赛', state:'亚军', badge:'亚军', alive:false };
  return { stage:'淘汰赛', state:'已淘汰', badge:'淘汰', alive:false };
};
const cardStatusData = {};
for (const team of cards.teams) {
  if (!team.qualified) {
    cardStatusData[team.id] = { team: team.name, stage:'场外', state:'场外彩蛋', badge:'彩蛋', alive:false, updatedAt: todayBjt };
  } else if (!roundOf32Pairs.flat().includes(team.id)) {
    cardStatusData[team.id] = { team: team.name, stage:'小组赛', state:'小组出局', badge:'出局', alive:false, updatedAt: todayBjt };
  } else {
    cardStatusData[team.id] = { team: team.name, stage:'淘汰赛', state:'晋级中', badge:'晋级', alive:true, updatedAt: todayBjt };
  }
}
for (const match of allKnockoutMatches.filter(match => match.status === 'finished')) {
  (match.eliminatedTeamIds || []).forEach(teamId => {
    const team = byId.get(teamId);
    if (!team) return;
    cardStatusData[teamId] = { team: team.name, ...statusForStage(match.stage), updatedAt: todayBjt };
  });
  if (match.stage === 'third-place') {
    (match.qualifiedTeamIds || []).forEach(teamId => {
      const team = byId.get(teamId);
      if (!team) return;
      cardStatusData[teamId] = { team: team.name, stage:'季军', state:'获得季军', badge:'铜牌', alive:false, updatedAt: todayBjt };
    });
  }
  if (match.stage === 'final') {
    (match.qualifiedTeamIds || []).forEach(teamId => {
      const team = byId.get(teamId);
      if (!team) return;
      cardStatusData[teamId] = { team: team.name, stage:'冠军', state:'获得冠军', badge:'冠军', alive:false, updatedAt: todayBjt };
    });
  }
}
for (const [teamId, matchId] of currentMatchIdsByTeam.entries()) {
  const team = byId.get(teamId);
  const match = allKnockoutMatches.find(item => item.id === matchId);
  if (!team || !match) continue;
  if (match.stage === 'final') {
    cardStatusData[teamId] = { team: team.name, stage:'决赛', state:'决赛待战', badge:'决赛', alive:true, updatedAt: todayBjt };
  } else if (match.stage === 'third-place') {
    cardStatusData[teamId] = { team: team.name, stage:'三四名赛', state:'待战季军赛', badge:'季军赛', alive:true, updatedAt: todayBjt };
  } else if (match.stage === 'semi-finals') {
    cardStatusData[teamId] = { team: team.name, stage:'半决赛', state:'半决赛待战', badge:'四强', alive:true, updatedAt: todayBjt };
  }
}

const knockoutData = {
  updatedAt: todayBjt,
  asOf,
  timezone: 'Asia/Shanghai',
  stage: 'complete',
  note: '截至北京时间 7 月 20 日 06:07，2026 世界杯全部结束：西班牙 1-0 阿根廷夺冠，阿根廷亚军，英格兰 6-4 法国获得季军，法国第四。',
  sources: [
    {
      name: 'FIFA World Cup 2026 knockout bracket',
      url: 'https://www.fifa.com/en/articles/knockout-stage-match-schedule-bracket',
    },
    {
      name: 'beIN Sports final Round of 32 line-up',
      url: 'https://www.beinsports.com/en-mena/football/fifa-world-cup-2026/articles-video/final-round-of-32-line-up-confirmed-2026-06-28',
    },
    {
      name: 'ESPN FIFA World Cup scoreboard',
      url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard',
    },
    {
      name: 'ESPN FIFA World Cup fixtures and results',
      url: 'https://www.espn.com/soccer/story/_/id/48939282/2026-fifa-world-cup-fixtures-results-match-schedule-group-stage-knockout-rounds-bracket',
    },
    {
      name: 'SB Nation Round of 16 scores',
      url: 'https://www.sbnation.com/soccer/1121525/2026-world-cup-round-of-16-scores-schedule',
    },
    {
      name: 'AP Argentina 3-1 Switzerland quarter-final report',
      url: 'https://apnews.com/article/world-cup-argentina-switzerland-score-d47ccb4ac5b3af67eca1f82228155174',
    },
    {
      name: 'FourFourTwo 2026 World Cup scores and fixtures',
      url: 'https://www.fourfourtwo.com/competition/all-of-the-world-cup-scores-so-far-at-the-2026-tournament',
    },
    {
      name: 'AP Spain 2-0 France semifinal report',
      url: 'https://apnews.com/article/87fb7740fa552edf4bfd28d0e8727c23',
    },
    {
      name: 'Guardian France 0-2 Spain semifinal live report',
      url: 'https://www.theguardian.com/football/live/2026/jul/14/france-v-spain-world-cup-2026-semi-final-live',
    },
    {
      name: 'AP Argentina 2-1 England semifinal report',
      url: 'https://apnews.com/article/afa13ed9fa933f8b75bd56eb16546031',
    },
    {
      name: 'Guardian England 1-2 Argentina semifinal report',
      url: 'https://www.theguardian.com/football/2026/jul/15/england-argentina-world-cup-semi-final-match-report',
    },
    {
      name: 'AP England 6-4 France third-place report',
      url: 'https://apnews.com/article/52f94eda6ff6d268d38aaefbc446c525',
    },
    {
      name: 'FIFA Spain v Argentina final preview',
      url: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/spain-v-argentina-live-stream-team-news-tickets-and-more',
    },
    {
      name: 'AP Spain 1-0 Argentina final report',
      url: 'https://apnews.com/article/fccc26aa12d9226e63d06b601b770617',
    },
  ],
  qualifiedTeamIds: [...new Set(roundOf32Pairs.flat())],
  roundOf16TeamIds: knockoutRounds[1].matches.flatMap(match => [match.homeId, match.awayId]),
  rounds: knockoutRounds,
};

const knockoutMatchesForCards = knockoutRounds.flatMap(round => round.matches).filter(match => match.homeId && match.awayId).map(match => ({
  id: `knockout-${match.id}`,
  matchId: match.id,
  stage: match.stage,
  home: match.homeZh,
  away: match.awayZh,
  homeEn: match.homeEn,
  awayEn: match.awayEn,
  homeId: match.homeId,
  awayId: match.awayId,
  date: `2026-${match.dateLabelZh.slice(0, match.dateLabelZh.indexOf(' ')).split('/').map(part => part.padStart(2, '0')).join('-')}`,
  time: match.timeBjt,
  timezone: 'Asia/Shanghai',
  venue: match.venue,
  city: match.cityZh,
  status: match.status,
  homeScore: match.homeScore,
  awayScore: match.awayScore,
  winner: match.winner,
  decidedBy: match.decidedBy,
  ...(match.decidedBy === 'penalties' ? {
    homeShootoutScore: match.homeShootoutScore,
    awayShootoutScore: match.awayShootoutScore,
  } : {}),
  qualifiedTeamIds: match.qualifiedTeamIds,
  eliminatedTeamIds: match.eliminatedTeamIds,
}));
matchesData.results = knockoutMatchesForCards.filter(match => match.status === 'finished');
matchesData.today = knockoutMatchesForCards.filter(match => match.status !== 'finished' && isTodayGameWindowMatch(match));

fs.writeFileSync(matchesPath, `${JSON.stringify(matchesData, null, 2)}\n`);
fs.writeFileSync(standingsPath, `${JSON.stringify(standingsData, null, 2)}\n`);
fs.writeFileSync(knockoutPath, `${JSON.stringify(knockoutData, null, 2)}\n`);
fs.writeFileSync(cardStatusPath, `${JSON.stringify(cardStatusData, null, 2)}\n`);
console.log(`Wrote ${matches.length} matches (${Object.keys(results).length} finished), 12 group tables, ${roundOf32Pairs.length} Round of 32 fixtures, and ${Object.keys(cardStatusData).length} card statuses.`);
