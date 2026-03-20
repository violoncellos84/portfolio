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

// CSV 파싱 (구글 시트 내보내기 형식 대응)
const raw   = fs.readFileSync(CSV_PATH, 'utf8').replace(/\r/g, '');
const lines = raw.split('\n');

// 데이터 행(https:// 포함)에서 URL 컬럼과 프로젝트ID 컬럼 위치를 직접 감지
let urlIdx = -1, projIdx = -1, dataStart = 0;

for (let i = 0; i < lines.length; i++) {
  const cols = lines[i].split(',');
  const ui = cols.findIndex(c => c.trim().startsWith('https://'));
  if (ui !== -1) {
    urlIdx    = ui;
    dataStart = i;
    // 프로젝트ID는 마지막 비어있지 않은 컬럼, 또는 URL 뒤에 오는 비숫자 컬럼
    // 일단 마지막 컬럼으로 설정, 이후 실제 값 있는 행에서 확인
    projIdx = cols.length - 1;
    break;
  }
}

if (urlIdx === -1) {
  console.error('CSV에서 URL 데이터를 찾을 수 없습니다.');
  process.exit(1);
}

console.log(`URL 컬럼: ${urlIdx}번째 (${String.fromCharCode(65+urlIdx)}열), 프로젝트ID 컬럼: ${projIdx}번째 (${String.fromCharCode(65+projIdx)}열), 데이터 시작: ${dataStart+1}행`);

// 프로젝트ID별 URL 그룹화
const grouped = {};
let count = 0;

for (let i = dataStart; i < lines.length; i++) {
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
