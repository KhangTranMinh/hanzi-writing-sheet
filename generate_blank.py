#!/usr/bin/env python3
"""Generate one printable A4 page of blank 18 mm Hanzi practice squares.

Run: python3 generate_blank.py
Requires Chrome, Edge, or Chromium (same as generate.py).
"""
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

COLS = 10
ROWS = 14
CELL_MM = 18
MARGIN_MM = 3


def find_browser():
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
    for name in ('google-chrome', 'chromium', 'chromium-browser', 'microsoft-edge', 'chrome'):
        found = shutil.which(name)
        if found:
            return found
    raise RuntimeError('Không tìm thấy Chrome, Edge hoặc Chromium để tạo PDF.')


def make_html():
    # A4, 3 mm margins. All squares remain exactly 18 x 18 mm.
    # 14 rows, contiguous columns, with 3 mm vertical whitespace only.
    css = f'''@page {{ size: A4 portrait; margin: 0; }}
* {{ box-sizing: border-box; }}
html, body {{ width: 210mm; height: 297mm; margin: 0; padding: 0; background: white; }}
.sheet {{ width: 210mm; height: 297mm; padding: {MARGIN_MM}mm;
          display: grid;
          grid-template-columns: repeat({COLS}, {CELL_MM}mm);
          grid-template-rows: repeat({ROWS}, {CELL_MM}mm);
          column-gap: 0;
          row-gap: 3mm;
          justify-content: center;
          align-content: start;
          overflow: hidden; break-inside: avoid; }}
.cell {{ position: relative; width: {CELL_MM}mm; height: {CELL_MM}mm;
         border-top: .18mm solid #444; border-bottom: .18mm solid #444;
         border-right: .18mm solid #444; border-left: 0; overflow: hidden; }}
/* Only the first cell in each row draws a left border; shared edges draw once. */
.cell:nth-child({COLS}n + 1) {{ border-left: .18mm solid #444; }}
.guide {{ display: block; width: 100%; height: 100%; }}
@media print {{ * {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }} }}
'''
    # SVG strokes are more reliable than CSS rotated dashed borders when printing.
    guides = ('<svg class="guide" viewBox="0 0 1024 1024" '
              'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
              '<path d="M512 0V1024 M0 512H1024 M0 0L1024 1024 M1024 0L0 1024" '
              'fill="none" stroke="#b8c0c8" stroke-width="7" '
              'stroke-dasharray="35 27"/></svg>')
    cell = '<div class="cell">' + guides + '</div>'
    return ('<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8">'
            '<title>Blank Hanzi Writing Practice</title><style>' + css
            + '</style></head><body><main class="sheet">'
            + cell * (COLS * ROWS) + '</main></body></html>')


def main():
    root = Path(__file__).resolve().parent
    out = root / 'output'
    out.mkdir(exist_ok=True)
    html_path = out / 'practice_blank.html'
    pdf_path = out / 'practice_blank.pdf'
    try:
        browser = find_browser()
        html_path.write_text(make_html(), encoding='utf-8')
        if pdf_path.exists():
            pdf_path.unlink()
        with tempfile.TemporaryDirectory(prefix='hanzi-blank-browser-') as profile:
            cmd = [browser, '--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
                   '--no-pdf-header-footer', '--user-data-dir=' + profile,
                   '--print-to-pdf=' + str(pdf_path.resolve()), html_path.resolve().as_uri()]
            if sys.platform.startswith('linux') and hasattr(os, 'geteuid') and os.geteuid() == 0:
                cmd.insert(1, '--no-sandbox')
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
        if result.returncode != 0 or not pdf_path.is_file() or pdf_path.stat().st_size == 0:
            raise RuntimeError('Không xuất được PDF: ' + (result.stderr or result.stdout)[-600:])
        print(f'Created: {pdf_path} | A4 | {COLS} x {ROWS} = {COLS*ROWS} cells ({CELL_MM}mm square)')
        return 0
    except (OSError, RuntimeError, subprocess.TimeoutExpired) as exc:
        print('ERROR:', exc, file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
