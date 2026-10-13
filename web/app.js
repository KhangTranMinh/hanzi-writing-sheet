(() => {
  "use strict";

  const DATA_VERSION = "2.0.1";
  const ROWS = 16;
  const COLS = 11;
  const CELL_MM = 18;
  const GUIDE = '<path d="M512 0V1024 M0 512H1024 M0 0L1024 1024 M1024 0L0 1024" fill="none" stroke="#b8c0c8" stroke-width="7" stroke-dasharray="35 27"/>';
  const form = document.querySelector("#generator-form");
  const textarea = document.querySelector("#characters");
  const charactersField = document.querySelector("#characters-field");
  const message = document.querySelector("#form-message");
  const button = document.querySelector("#generate-button");

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
.result-toolbar { display:flex; justify-content:center; align-items:center; gap:14px; padding:12px; background:#252923; color:#fff; font:13px Arial,sans-serif; }
.result-toolbar button { padding:8px 14px; border:0; border-radius:5px; background:#dfe8d7; color:#273222; cursor:pointer; font-weight:700; }
.result-toolbar span { opacity:.8; }
@media print { html,body { width:210mm; background:white; }
               .sheet { margin:0; }
               .character-panel { break-inside:avoid; page-break-inside:avoid; }
               .result-toolbar { display:none !important; }
               * { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
`;

  const blankCss = `
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; background: white; }
.sheet { width: 210mm; height: 297mm; padding: 3mm;
         display: grid;
         grid-template-columns: repeat(${COLS}, ${CELL_MM}mm);
         grid-template-rows: repeat(${ROWS}, ${CELL_MM}mm);
         column-gap: 0; row-gap: 0;
         justify-content: center; align-content: center;
         overflow: hidden; break-inside: avoid; }
.cell { position: relative; width: ${CELL_MM}mm; height: ${CELL_MM}mm;
        border-right: .18mm solid #444; border-bottom: .18mm solid #444;
        border-top: 0; border-left: 0; overflow: hidden; }
.cell:nth-child(-n + ${COLS}) { border-top: .18mm solid #444; }
.cell:nth-child(${COLS}n + 1) { border-left: .18mm solid #444; }
.guide { display:block; width:100%; height:100%; }
.result-toolbar { display:flex; justify-content:center; align-items:center; gap:14px; padding:12px; background:#252923; color:#fff; font:13px Arial,sans-serif; }
.result-toolbar button { padding:8px 14px; border:0; border-radius:5px; background:#dfe8d7; color:#273222; cursor:pointer; font-weight:700; }
.result-toolbar span { opacity:.8; }
@media print { .result-toolbar { display:none !important; } * { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
`;

  function selectedMode() {
    return form.querySelector('input[name="mode"]:checked').value;
  }

  function updateMode() {
    const isBlank = selectedMode() === "blank";
    charactersField.hidden = isBlank;
    textarea.disabled = isBlank;
    message.textContent = "";
  }

  function isHanzi(character) {
    const point = character.codePointAt(0);
    return (point >= 0x3400 && point <= 0x9fff)
      || (point >= 0xf900 && point <= 0xfaff)
      || (point >= 0x20000 && point <= 0x2fa1f);
  }

  function parseCharacters(text) {
    return [...new Set([...text].filter(isHanzi))];
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[character]);
  }

  function svgPaths(paths, className, step = null, withGuide = false) {
    let output = `<svg class="${className}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
    if (withGuide) output += GUIDE;
    output += '<g transform="translate(512 512) scale(.9) translate(-512 -512) translate(0,900) scale(1,-1)">';
    paths.forEach((path, index) => {
      let color = "#111111";
      if (step !== null) {
        if (index === step) color = "#d32f2f";
        else if (index < step) color = "#191919";
        else color = "#e2e4e7";
      }
      output += `<path d="${escapeHtml(path)}" fill="${color}"/>`;
    });
    return `${output}</g></svg>`;
  }

  async function fetchCharacterData(character) {
    const localUrl = new URL(`data/${encodeURIComponent(character)}.json`, window.location.href);
    try {
      const localResponse = await fetch(localUrl);
      if (localResponse.ok) return await localResponse.json();
    } catch (_) {
      // file:// pages cannot fetch local JSON; the CDN fallback still works when online.
    }

    const cdnUrl = `https://unpkg.com/hanzi-writer-data@${DATA_VERSION}/${encodeURIComponent(character)}.json`;
    const response = await fetch(cdnUrl);
    if (!response.ok) throw new Error(`Không tìm thấy dữ liệu nét cho chữ “${character}”.`);
    return response.json();
  }

  function pinyinFor(character) {
    const converter = window.pinyinPro && window.pinyinPro.pinyin;
    if (converter) return converter(character);
    return character === "字" ? "zì" : "";
  }

  function characterPanel(character, data) {
    const paths = data.strokes;
    if (!Array.isArray(paths) || paths.length === 0 || paths.some((path) => typeof path !== "string")) {
      throw new Error(`Dữ liệu nét của chữ “${character}” không hợp lệ.`);
    }
    if (paths.length > 20) throw new Error(`Chữ “${character}” có ${paths.length} nét, vượt giới hạn 20 nét.`);

    const sample = svgPaths(paths, "sample-svg", null, true);
    const steps = Array.from({ length: 20 }, (_, index) => {
      const content = index < paths.length
        ? svgPaths(paths, "stroke-svg", index, true)
        : svgPaths([], "stroke-svg", null, true);
      const label = index < paths.length ? `Bước ${index + 1}` : "Ô trống";
      return `<div class="stroke-cell" aria-label="${label}">${content}</div>`;
    }).join("");

    const practice = Array.from({ length: 20 }, (_, index) => {
      const guide = svgPaths([], "practice-guide", null, true);
      const sampleContent = index < 4 ? svgPaths(paths, "practice-svg") : "";
      return `<div class="practice-cell${index === 0 ? " first" : ""}">${guide}${sampleContent}</div>`;
    }).join("");

    return `<section class="character-panel">
      <div class="top-row">
        <div class="character-column"><div class="sample">${sample}</div><div class="pinyin">${escapeHtml(pinyinFor(character))}</div></div>
        <div class="stroke-grid">${steps}</div>
      </div>
      <div class="practice-grid">${practice}</div>
    </section>`;
  }

  function toolbar() {
    return '<nav class="result-toolbar"><button type="button" onclick="window.print()">In / lưu PDF</button><span>Trong hộp thoại in, chọn “Save as PDF”.</span></nav>';
  }

  function documentHtml(title, css, content) {
    return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${css}</style></head><body>${content}</body></html>`;
  }

  function renderWorksheet(panels) {
    const pages = [];
    for (let index = 0; index < panels.length; index += 4) {
      const pagePanels = panels.slice(index, index + 4);
      while (pagePanels.length < 4) {
        pagePanels.push('<section class="character-panel placeholder" aria-hidden="true"></section>');
      }
      pages.push(`<main class="sheet">${pagePanels.join("")}</main>`);
    }
    return documentHtml("Hanzi writing practice", worksheetCss, `${toolbar()}${pages.join("")}`);
  }

  function renderBlank() {
    const guide = `<svg class="guide" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${GUIDE}</svg>`;
    const cell = `<div class="cell">${guide}</div>`;
    const cells = cell.repeat(COLS * ROWS);
    return documentHtml("Blank Hanzi writing practice", blankCss, `${toolbar()}<main class="sheet">${cells}</main>`);
  }

  function writeTab(tab, html) {
    if (!tab || tab.closed) return;
    tab.document.open();
    tab.document.write(html);
    tab.document.close();
  }

  function loadingDocument() {
    return '<!doctype html><html lang="vi"><meta charset="utf-8"><title>Đang tạo trang</title><body style="font:16px system-ui;padding:40px;color:#333">Đang tải dữ liệu nét chữ…</body></html>';
  }

  function errorDocument(error) {
    const safeMessage = escapeHtml(error && error.message ? error.message : "Không thể tạo trang.");
    return `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Không thể tạo trang</title><body style="font:16px/1.6 system-ui;max-width:680px;margin:64px auto;padding:0 20px;color:#333"><h1>Không thể tạo trang</h1><p>${safeMessage}</p><p>Kiểm tra kết nối mạng hoặc thử lại.</p></body></html>`;
  }

  async function generate(tab, mode, input) {
    if (mode === "blank") {
      writeTab(tab, renderBlank());
      return;
    }
    const characters = parseCharacters(input);
    if (characters.length === 0) throw new Error("Hãy nhập ít nhất một chữ Hán.");
    const data = await Promise.all(characters.map(fetchCharacterData));
    const panels = characters.map((character, index) => characterPanel(character, data[index]));
    writeTab(tab, renderWorksheet(panels));
  }

  form.querySelectorAll('input[name="mode"]').forEach((radio) => radio.addEventListener("change", updateMode));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";
    const mode = selectedMode();
    const input = textarea.value;
    if (mode === "characters" && parseCharacters(input).length === 0) {
      message.textContent = "Hãy nhập ít nhất một chữ Hán.";
      textarea.focus();
      return;
    }

    const resultTab = window.open("about:blank", "_blank");
    if (!resultTab) {
      message.textContent = "Trình duyệt đã chặn tab mới. Cho phép pop-up rồi bấm Tạo trang lần nữa.";
      return;
    }
    writeTab(resultTab, loadingDocument());
    button.disabled = true;
    button.querySelector("span:first-child").textContent = "Đang tạo…";
    try {
      await generate(resultTab, mode, input);
    } catch (error) {
      writeTab(resultTab, errorDocument(error));
    } finally {
      button.disabled = false;
      button.querySelector("span:first-child").textContent = "Tạo trang";
    }
  });

  updateMode();
})();
