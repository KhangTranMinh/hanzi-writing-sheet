# Local version

This folder contains the Python scripts, input, requirements, and stroke data for the local version. It is self-contained and does not read files from `web/`.

## Files

- `generate.py`: reads `characters.txt`, creates four character panels per A4 page, and writes timestamped plus latest HTML/PDF files in `output/`.
- `Run.command`: creates `.venv` if needed, installs requirements, runs `generate.py`, and opens the latest PDF on macOS.
- `generate_blank.py`: creates an A4 blank practice page with 11 columns × 16 rows of 18 mm squares.
- `Run-Blank.command`: runs the blank-page generator and opens its PDF on macOS.
- `data/`: cached Hanzi stroke JSON, used locally and expanded when new characters are downloaded.
- `characters.txt`: Hanzi input; the generator extracts Hanzi characters and removes duplicates while preserving order.

`Run.command` needs Python 3, internet access for characters that are not cached, and Chrome, Edge, or Chromium to create PDFs. It installs Python packages from `requirements.txt` into `.venv/`.

The blank-page script needs Python 3 and Chrome, Edge, or Chromium. Double-click the corresponding `.command` file on macOS.
