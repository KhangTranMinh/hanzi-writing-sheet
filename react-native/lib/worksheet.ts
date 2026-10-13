import { pinyin } from 'pinyin-pro';

export type WorksheetMode = 'characters' | 'blank';

export type CharacterData = {
  strokes: string[];
};

export const parseCharacters = (input: string): string[] => {
  const characters = Array.from(input).filter((character) => {
    const point = character.codePointAt(0) ?? 0;
    return (
      (point >= 0x3400 && point <= 0x9fff) ||
      (point >= 0xf900 && point <= 0xfaff) ||
      (point >= 0x20000 && point <= 0x2fa1f)
    );
  });
  return Array.from(new Set(characters));
};

const bundledData: Record<string, CharacterData> = {
  粥: require('../data/粥.json'),
  茶: require('../data/茶.json'),
  姜: require('../data/姜.json'),
  是: require('../data/是.json'),
  和: require('../data/和.json'),
  康: require('../data/康.json'),
  这: require('../data/这.json'),
  芳: require('../data/芳.json'),
  越: require('../data/越.json'),
  黄: require('../data/黄.json'),
  热: require('../data/热.json'),
  陈: require('../data/陈.json'),
  豆: require('../data/豆.json'),
  米: require('../data/米.json'),
  饭: require('../data/饭.json'),
  水: require('../data/水.json'),
  日: require('../data/日.json'),
  啡: require('../data/啡.json'),
  咖: require('../data/咖.json'),
  东: require('../data/东.json'),
  腐: require('../data/腐.json'),
  明: require('../data/明.json'),
};

const DATA_VERSION = '2.0.1';
const GUIDE =
  '<path d="M512 0V1024 M0 512H1024 M0 0L1024 1024 M1024 0L0 1024" fill="none" stroke="#b8c0c8" stroke-width="7" stroke-dasharray="35 27"/>';

const worksheetCss = `
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html, body { padding:0; margin:0; background:#ededed; }
body { font-family: Arial, sans-serif; }
.sheet { width:210mm; height:297mm; padding:3mm; margin:10px auto;
         background:white; display:flex; flex-direction:column; gap:5mm;
         justify-content:center;
         break-after:page; page-break-after:always; overflow:hidden; }
.sheet:last-child { break-after:auto !important; page-break-after:auto !important; }
.character-panel { flex:0 0 69mm; height:69mm; max-height:69mm; width:100%; display:flex; flex-direction:column; overflow:hidden;
                   gap:2mm; border:0.22mm solid #555; padding:2mm; min-height:0; }
.character-panel.placeholder { visibility:hidden; }
.top-row { width:100%; height:25.8mm; display:flex;
           justify-content:space-between; align-items:flex-start; }
.character-column { width:23mm; flex:0 0 23mm; display:flex;
                    flex-direction:column; align-items:center; gap:.5mm; }
.sample { width:23mm; height:23mm; border:0.18mm solid #444; overflow:hidden; }
.sample-svg, .stroke-svg { display:block; width:100%; height:100%; }
.pinyin { text-align:center; font-size:9pt; line-height:3.4mm; height:3.4mm; }
.stroke-grid { width:114mm; height:22mm; display:grid;
               grid-template-columns:repeat(10, 10.5mm);
               grid-template-rows:repeat(2, 10.5mm);
               gap:1mm; align-content:start; }
.stroke-cell { width:10.5mm; height:10.5mm; border:.16mm solid #444; overflow:hidden; }
.practice-grid { width:100%; height:37mm; display:grid;
                 grid-template-columns:repeat(10, 18mm);
                 grid-template-rows:repeat(2, 18mm);
                 justify-content:space-between; row-gap:1mm; column-gap:0; }
.practice-cell { position:relative; width:18mm; height:18mm;
                 border:.18mm solid #444; overflow:hidden; }
.practice-guide { position:absolute; inset:0; display:block; width:100%; height:100%; z-index:0; }
.practice-cell.first .practice-svg { opacity:1; }
.practice-svg { position:relative; z-index:1; display:block;
                width:100%; height:100%; opacity:.23; }
@media screen and (max-width:800px) {
  html, body { width:100%; }
  .sheet { width:100vw; height:calc(100vw * 297 / 210); padding:1.43%; margin:12px auto; gap:1.68vw; }
  .character-panel { flex:0 0 23.23%; height:23.23%; max-height:23.23%; gap:.95vw; border-width:.1vw; padding:.95vw; }
  .top-row { height:37.39%; }
  .character-column { width:11.27%; flex:0 0 11.27%; gap:.24vw; }
  .sample { width:100%; height:auto; aspect-ratio:1; border-width:.08vw; }
  .pinyin { font-size:1.5vw; line-height:1.8vw; height:1.8vw; }
  .stroke-grid { width:55.88%; height:31.88%; grid-template-columns:repeat(10, 9.21%); grid-template-rows:repeat(2, 47.73%); column-gap:.88%; row-gap:4.55%; }
  .stroke-cell { width:100%; height:100%; border-width:.07vw; }
  .practice-grid { height:53.62%; grid-template-columns:repeat(10, 8.82%); grid-template-rows:repeat(2, 48.65%); row-gap:2.7%; }
  .practice-cell { width:100%; height:100%; border-width:.08vw; }
}
@media print { html,body { width:210mm; background:white; }
               .sheet { margin:0; }
               .character-panel { break-inside:avoid; page-break-inside:avoid; }
               * { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
`;

const blankCss = `
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; background: white; }
.sheet { width: 210mm; height: 297mm; padding: 3mm;
         display: grid;
         grid-template-columns: repeat(11, 18mm);
         grid-template-rows: repeat(16, 18mm);
         column-gap: 0; row-gap: 0;
         justify-content: center; align-content: center;
         overflow: hidden; break-inside: avoid; }
.cell { position: relative; width: 18mm; height: 18mm;
        border-right: .18mm solid #444; border-bottom: .18mm solid #444;
        border-top: 0; border-left: 0; overflow: hidden; }
.cell:nth-child(-n + 11) { border-top: .18mm solid #444; }
.cell:nth-child(11n + 1) { border-left: .18mm solid #444; }
.guide { display:block; width:100%; height:100%; }
@media screen and (max-width:800px) {
  html, body { width:100%; height:auto; }
  .sheet { width:100vw; height:calc(100vw * 297 / 210); padding:1.43vw;
           grid-template-columns:repeat(11, 8.57%); grid-template-rows:repeat(16, 6.06%);
           margin:12px auto; }
  .cell { width:100%; height:100%; border-width:.08vw; }
}
@media print { * { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
`;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
      character
    ] as string,
  );
}

function svgPaths(
  paths: string[],
  className: string,
  step: number | null = null,
  withGuide = false,
): string {
  let output = `<svg class="${className}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
  if (withGuide) output += GUIDE;
  output +=
    '<g transform="translate(512 512) scale(.9) translate(-512 -512) translate(0,900) scale(1,-1)">';
  paths.forEach((path, index) => {
    let color = '#111111';
    if (step !== null) {
      if (index === step) color = '#d32f2f';
      else if (index < step) color = '#191919';
      else color = '#e2e4e7';
    }
    output += `<path d="${escapeHtml(path)}" fill="${color}"/>`;
  });
  return `${output}</g></svg>`;
}

async function fetchCharacterData(character: string): Promise<CharacterData> {
  if (bundledData[character]) return bundledData[character];

  const url = `https://unpkg.com/hanzi-writer-data@${DATA_VERSION}/${encodeURIComponent(character)}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Không tìm thấy dữ liệu nét cho chữ “${character}”.`);
  }
  return (await response.json()) as CharacterData;
}

function characterPanel(character: string, data: CharacterData): string {
  const paths = data.strokes;
  if (
    !Array.isArray(paths) ||
    paths.length === 0 ||
    paths.some((path) => typeof path !== 'string')
  ) {
    throw new Error(`Dữ liệu nét của chữ “${character}” không hợp lệ.`);
  }
  if (paths.length > 20) {
    throw new Error(`Chữ “${character}” có ${paths.length} nét, vượt giới hạn 20 nét.`);
  }

  const sample = svgPaths(paths, 'sample-svg', null, true);
  const steps = Array.from({ length: 20 }, (_, index) => {
    const content =
      index < paths.length
        ? svgPaths(paths, 'stroke-svg', index, true)
        : svgPaths([], 'stroke-svg', null, true);
    return `<div class="stroke-cell" aria-label="${index < paths.length ? `Bước ${index + 1}` : 'Ô trống'}">${content}</div>`;
  }).join('');

  const practice = Array.from({ length: 20 }, (_, index) => {
    const guide = svgPaths([], 'practice-guide', null, true);
    const sampleContent = index < 4 ? svgPaths(paths, 'practice-svg') : '';
    return `<div class="practice-cell${index === 0 ? ' first' : ''}">${guide}${sampleContent}</div>`;
  }).join('');

  return `<section class="character-panel">
    <div class="top-row">
      <div class="character-column"><div class="sample">${sample}</div><div class="pinyin">${escapeHtml(pinyin(character))}</div></div>
      <div class="stroke-grid">${steps}</div>
    </div>
    <div class="practice-grid">${practice}</div>
  </section>`;
}

function documentHtml(title: string, css: string, content: string): string {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=3,user-scalable=yes"><title>${title}</title><style>${css}</style></head><body>${content}</body></html>`;
}

export function renderBlankHtml(): string {
  const cell = `<div class="cell"><svg class="guide" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${GUIDE}</svg></div>`;
  return documentHtml(
    'Blank Hanzi writing practice',
    blankCss,
    `<main class="sheet">${cell.repeat(11 * 16)}</main>`,
  );
}

export async function renderWorksheetHtml(input: string): Promise<string> {
  const characters = parseCharacters(input);
  if (characters.length === 0) throw new Error('Hãy nhập ít nhất một chữ Hán.');

  const data = await Promise.all(characters.map(fetchCharacterData));
  const panels = characters.map((character, index) => characterPanel(character, data[index]));
  const pages: string[] = [];
  for (let index = 0; index < panels.length; index += 4) {
    const pagePanels = panels.slice(index, index + 4);
    while (pagePanels.length < 4) {
      pagePanels.push('<section class="character-panel placeholder" aria-hidden="true"></section>');
    }
    pages.push(`<main class="sheet">${pagePanels.join('')}</main>`);
  }
  return documentHtml('Hanzi writing practice', worksheetCss, pages.join(''));
}
