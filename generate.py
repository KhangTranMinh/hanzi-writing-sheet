#!/usr/bin/env python3
"""Generate offline, print-ready A4 Hanzi writing worksheets.

Usage:
  python generate.py --chars '字' --repeat-single
  python generate.py --chars '陈日东热' --output output/practice.html
  python generate.py --chars '字' --offline --data-dir data
  python generate.py --input-file characters.txt

Requires: python3 -m pip install -r requirements.txt
"""
import argparse
from datetime import datetime
import html
import json
import os
import shutil
import subprocess
import tempfile
import ssl
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

try:
    import certifi
except ImportError as exc:
    raise SystemExit(
        "Missing certifi. Install it with: python3 -m pip install -r requirements.txt"
    ) from exc

CDN = 'https://unpkg.com/hanzi-writer-data@2.0.1/'


def is_hanzi(ch):
    o = ord(ch)
    return (0x3400 <= o <= 0x9FFF or 0xF900 <= o <= 0xFAFF
            or 0x20000 <= o <= 0x2FA1F)


def svg_paths(paths, size_class, step=None, guide=False):
    # Hanzi Writer paths use an upward-increasing y axis; SVG flips it.
    out = [f'<svg class="{size_class}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">']
    if guide:
        out.append('<path d="M512 0V1024 M0 512H1024 M0 0L1024 1024 M1024 0L0 1024" fill="none" stroke="#b8c0c8" stroke-width="7" stroke-dasharray="35 27"/>')
    out.append('<g transform="translate(0,900) scale(1,-1)">')
    for index, d in enumerate(paths):
        if step is None:
            color = '#111111'
        elif index == step:
            color = '#d32f2f'
        elif index < step:
            color = '#191919'
        else:
            color = '#e2e4e7'
        out.append(f'<path d="{html.escape(d, quote=True)}" fill="{color}"/>')
    out.append('</g></svg>')
    return ''.join(out)


def fetch(char, data_dir, offline=False):
    target = data_dir / f'{char}.json'
    if target.is_file():
        obj = json.loads(target.read_text(encoding='utf-8'))
    elif offline:
        raise FileNotFoundError(f'Không tìm thấy {target} (--offline)')
    else:
        url = CDN + quote(char, safe='') + '.json'
        print(f'Downloading {char}: {url}')
        req = Request(url, headers={'User-Agent': 'HanziPractice/1.0'})
        try:
            # Use certifi's trusted CA bundle on macOS/Python installations
            # whose default certificate store is not configured.
            context = ssl.create_default_context(cafile=certifi.where())
            with urlopen(req, timeout=20, context=context) as resp:
                obj = json.loads(resp.read().decode('utf-8'))
        except (HTTPError, URLError, ssl.SSLError) as exc:
            hint = (' SSL certificate không hợp lệ: chạy "python3 -m pip install certifi" '
                    'và đảm bảo không có HTTPS inspection/proxy thiếu CA.'
                    if 'CERTIFICATE_VERIFY_FAILED' in str(exc) else '')
            raise RuntimeError(f'Không tải được {char}.json: {exc}.{hint} '
                               f'Hoặc đặt file vào {data_dir}') from exc
        data_dir.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(obj, ensure_ascii=False), encoding='utf-8')
    if not isinstance(obj, dict) or not isinstance(obj.get('strokes'), list) or not obj['strokes']:
        raise ValueError(f'{target} không có strokes hợp lệ')
    if any(not isinstance(s, str) for s in obj['strokes']):
        raise ValueError(f'{target}: strokes phải là danh sách SVG paths')
    return obj


def get_pinyin(ch, override=None):
    if override is not None:
        return override
    try:
        from pypinyin import lazy_pinyin, Style
        return ' '.join(lazy_pinyin(ch, style=Style.TONE))
    except ImportError:
        return {'字': 'zì'}.get(ch, '')


def char_panel(ch, data, pinyin):
    paths = data['strokes']
    count = len(paths)
    if count > 20:
        raise ValueError(f'{ch} có {count} nét (giới hạn layout là 20 nét)')
    sample = svg_paths(paths, 'sample-svg', guide=True)
    steps = []
    for i in range(20):
        if i < count:
            content = svg_paths(paths, 'stroke-svg', step=i, guide=True)
            label = f'Bước {i+1}'
        else:
            content = svg_paths([], 'stroke-svg', guide=True)
            label = 'Ô trống'
        steps.append(f'<div class="stroke-cell" aria-label="{label}">{content}</div>')
    practice = []
    for i in range(20):
        # First four practice cells show one dark sample and three pale tracing samples.
        sample_content = svg_paths(paths, 'practice-svg', guide=False) if i < 4 else ''
        guide_content = svg_paths([], 'practice-guide', guide=True)
        practice.append(f'<div class="practice-cell{" first" if i == 0 else ""}">'
                        f'{guide_content}{sample_content}</div>')
    return (f'<section class="character-panel">'
            f'<div class="top-row">'
            f'<div class="character-column"><div class="sample">{sample}</div>'
            f'<div class="pinyin">{html.escape(pinyin)}</div></div>'
            f'<div class="stroke-grid">{"".join(steps)}</div></div>'
            f'<div class="practice-grid">{"".join(practice)}</div>'
            f'</section>')


CSS = r'''
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
html, body { padding:0; margin:0; background:#ededed; }
body { font-family: Arial, sans-serif; }
.sheet { width:210mm; height:289mm; padding:3mm; margin:10px auto;
         background:white; display:flex; flex-direction:column; gap:0;
         break-after:page; page-break-after:always; overflow:hidden; }
.sheet:last-child { break-after:auto !important; page-break-after:auto !important; }
/* Four equal-height panels per A4 sheet. The contents span the full width. */
.character-panel { flex:0 0 69mm; height:69mm; max-height:69mm; width:100%; display:flex; flex-direction:column; overflow:hidden;
                   gap:2mm; border:0.22mm solid #555; padding:2mm; min-height:0; }
.character-panel + .character-panel { border-top:0; }
.top-row { width:100%; height:25.8mm; display:flex;
           justify-content:space-between; align-items:flex-start; }
.character-column { width:23mm; flex:0 0 23mm; display:flex;
                    flex-direction:column; align-items:center; gap:.5mm; }
.sample { width:23mm; height:23mm; border:0.18mm solid #444; overflow:hidden; }
.sample-svg, .stroke-svg { display:block; width:100%; height:100%; }
.pinyin { text-align:center; font-size:9pt; line-height:3.4mm; height:3.4mm; }
/* 20 stroke boxes, 10 columns x 2 rows. All square, including empty boxes. */
.stroke-grid { width:114mm; height:22mm; display:grid;
               grid-template-columns:repeat(10, 10.5mm);
               grid-template-rows:repeat(2, 10.5mm);
               gap:1mm; align-content:start; }
.stroke-cell { width:10.5mm; height:10.5mm; border:.16mm solid #444; overflow:hidden; }
/* 20 writing boxes, 10 columns x 2 rows, both sides aligned to top row. */
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
@media print { html,body { width:210mm; background:white; }
               .sheet { margin:0; }
               .character-panel { break-inside:avoid; page-break-inside:avoid; }
               * { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
'''


def render(panels):
    pages = []
    for i in range(0, len(panels), 4):
        pages.append('<main class="sheet">' + ''.join(panels[i:i+4]) + '</main>')
    return ('<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<title>Hanzi writing practice</title><style>' + CSS + '</style></head><body>'
            + ''.join(pages) + '</body></html>')


def read_character_file(path):
    """Read UTF-8 input, extracting Hanzi individually from every line."""
    content = path.read_text(encoding='utf-8-sig')
    return [ch for ch in content if is_hanzi(ch)]


def find_browser():
    """Find Chrome, Edge or Chromium on macOS, Linux or Windows."""
    candidates = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        str(Path.home() / 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
        str(Path.home() / 'Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'),
        str(Path.home() / 'Applications/Chromium.app/Contents/MacOS/Chromium'),
    ]
    for path in candidates:
        if os.path.isfile(path) and os.access(path, os.X_OK):
            return path
    for executable in ('google-chrome', 'chromium', 'chromium-browser', 'microsoft-edge', 'chrome'):
        found = shutil.which(executable)
        if found:
            return found
    return None


def export_pdf(html_path, pdf_path):
    browser = find_browser()
    if browser is None:
        raise RuntimeError('Không tìm thấy Google Chrome, Microsoft Edge hoặc Chromium để xuất PDF.')
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='hanzi-browser-') as profile:
        cmd = [browser, '--headless', '--disable-gpu', '--no-first-run',
               '--no-default-browser-check', '--no-pdf-header-footer',
               '--user-data-dir=' + profile, '--print-to-pdf=' + str(pdf_path.resolve()),
               html_path.resolve().as_uri()]
        if sys.platform.startswith('linux') and hasattr(os, 'geteuid') and os.geteuid() == 0:
            cmd.insert(1, '--no-sandbox')  # Root-only Linux CI; not used on macOS.
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                text=True, timeout=90)
        if result.returncode != 0 or not pdf_path.is_file() or pdf_path.stat().st_size == 0:
            raise RuntimeError('Không xuất được PDF: ' + (result.stderr or result.stdout)[-800:])


def main():
    parser = argparse.ArgumentParser(description='Tạo HTML và PDF A4 từ characters.txt')
    parser.add_argument('--offline', action='store_true', help='Chỉ đọc dữ liệu thứ tự nét đã cache')
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    source = root / 'characters.txt'
    try:
        chars = list(dict.fromkeys(read_character_file(source)))
        if not chars:
            raise ValueError('characters.txt đang trống hoặc không có chữ Hán.')
        panels = []
        for ch in chars:
            data = fetch(ch, root / 'data', args.offline)
            panels.append(char_panel(ch, data, get_pinyin(ch)))
        output = root / 'output'
        output.mkdir(parents=True, exist_ok=True)
        # Timestamp in local time (year-month-day_hour-minute).
        # Avoid overwriting if the script runs multiple times in one minute.
        stamp = datetime.now().strftime('%Y-%m-%d_%H-%M')
        suffix = ''
        attempt = 1
        while (output / f'practice_{stamp}{suffix}.html').exists() or (output / f'practice_{stamp}{suffix}.pdf').exists():
            attempt += 1
            suffix = f'_{attempt}'
        html_path = output / f'practice_{stamp}{suffix}.html'
        pdf_path = output / f'practice_{stamp}{suffix}.pdf'
        html_content = render(panels)
        html_path.write_text(html_content, encoding='utf-8')
        export_pdf(html_path, pdf_path)
        # Keep stable latest filenames for compatibility with the existing Run.command.
        (output / 'practice.html').write_text(html_content, encoding='utf-8')
        shutil.copyfile(pdf_path, output / 'practice.pdf')
        print(f'Created {pdf_path} | {len(chars)} characters | {(len(chars)+3)//4} A4 pages')
        return 0
    except (OSError, ValueError, RuntimeError, UnicodeError, json.JSONDecodeError,
            subprocess.TimeoutExpired) as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
