#!/usr/bin/env python3
"""Build the static lesson catalog from lesson filenames."""
import json
import re
from pathlib import Path

DATA = Path(__file__).resolve().parents[2] / "web" / "lessons" / "data"
files = sorted(path.stem for path in DATA.glob("*.json") if re.fullmatch(r"\d{4}-\d{4}", path.stem))
(DATA / "index.json").write_text(json.dumps(files, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Đã cập nhật danh mục: {len(files)} bài học.")
