#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FILE = path.join(ROOT, 'data/processed/outdoor_routes_v13.json');
const OUT_JSON = path.join(ROOT, 'data/processed/qa/track-links-qa-latest.json');
const OUT_MD = path.join(ROOT, 'data/processed/qa/track-links-qa-latest.md');

function read(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function ensure(dir){fs.mkdirSync(dir,{recursive:true});}
function writeJson(file,data){fs.writeFileSync(file, JSON.stringify(data,null,2)+'\n');}

const data = read(FILE);
const routes = data.routes || [];
const counts = {ok:0,blocked:0,broken:0,error:0,unknown:0};
for(const r of routes){
  const s = r?.track_link_v10?.link_access_status || 'unknown';
  counts[s] = (counts[s] || 0) + 1;
}

const pass = counts.broken === 0 && counts.error === 0;
const summary = {
  generated_at: new Date().toISOString(),
  input: path.relative(ROOT, FILE),
  totals: { routes: routes.length, ...counts },
  pass,
  rules: [
    'broken 必须为 0',
    'error 必须为 0'
  ]
};

ensure(path.dirname(OUT_JSON));
writeJson(OUT_JSON, summary);

const md = [
  '# 轨迹链接 QA（最新）',
  '',
  `- 数据文件：${summary.input}`,
  `- 路线总数：${routes.length}`,
  `- 可用：${counts.ok}`,
  `- 受限：${counts.blocked}`,
  `- 失效：${counts.broken}`,
  `- 异常：${counts.error}`,
  `- 无链接：${counts.unknown}`,
  `- 结果：${pass ? 'PASS' : 'FAIL'}`,
  ''
].join('\n');
fs.writeFileSync(OUT_MD, md + '\n');

if(!pass){
  console.error(JSON.stringify({pass:false,counts},null,2));
  process.exit(1);
}
console.log(JSON.stringify({pass:true,counts},null,2));
