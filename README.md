# Hanzi Writing Practice

## Files
- `generate.py`: reads `characters.txt` (one or more Hanzi per line), generates 4 character blocks per A4 page, writes timestamped HTML/PDF plus latest `practice.html` and `practice.pdf`.
- `Run.command`: runs `generate.py` and opens the latest PDF.
- `generate_blank.py`: generates a blank A4 practice sheet with 11 columns x 16 rows of 18 mm squares, centered on the page with no gaps between cells.
- `Run-Blank.command`: runs `generate_blank.py` and opens the PDF.
- `requirements.txt`: install using `python3 -m pip install -r requirements.txt`.
- `characters.txt`: starts empty; add Hanzi here.

Both scripts use identical SVG guidelines for horizontal, vertical and diagonal dotted lines (viewBox 1024, color #b8c0c8, stroke-width 7, dash 35 27). The character-sheet practice cells use this SVG behind the letter strokes.

Chrome, Edge or Chromium is required to render PDFs. On macOS double-click either .command file.
