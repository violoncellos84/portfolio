/**
 * csv-to-json.js
 * image_urls.csv의 '프로젝트ID' 컬럼을 읽어 images.json의 artworks를 업데이트합니다.
 *
 * 사용법: node csv-to-json.js
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH  = path.join(__dirname, 'image_urls.csv');
const JSON_PATH = path.join(__dirname, 'images.json');

// CSV 파싱
const lines = fs.readFileSync(CSV_PATH, 'utf8').split('\n');
const headers = lines[0].split(',');
const urlIdx  = headers.indexOf('Raw URL');
const projIdx = headers.indexOf('프로젝트ID');

if (urlIdx === -1 || projIdx === -1) {
  console.error('CSV에서 "Raw URL" 또는 "프로젝트ID" 컬럼을 찾을 수 없습니다.');
  process.exit(1);
}

// 프로젝트ID별 URL 그룹화
const grouped = {};
let count = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const cols = line.split(',');
  const url  = cols[urlIdx]  ? cols[urlIdx].trim()  : '';
  const proj = cols[projIdx] ? cols[projIdx].trim()  : '';

  if (!proj || !url) continue;

  if (!grouped[proj]) grouped[proj] = [];
  grouped[proj].push(url);
  count++;
}

// images.json 업데이트
const json = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

for (const [proj, urls] of Object.entries(grouped)) {
  if (json.artworks[proj] === undefined) {
    console.warn(`경고: images.json에 "${proj}" 프로젝트가 없습니다. 새로 추가합니다.`);
    json.artworks[proj] = [];
  }
  // 기존 URL과 합산 후 중복 제거
  const merged = [...new Set([...json.artworks[proj], ...urls])];
  json.artworks[proj] = merged;
  console.log(`${proj}: ${urls.length}개 추가 (총 ${merged.length}개)`);
}

fs.writeFileSync(JSON_PATH, JSON.stringify(json, null, 2), 'utf8');
console.log(`\nimages.json 업데이트 완료 (총 ${count}개 URL 처리)`);
