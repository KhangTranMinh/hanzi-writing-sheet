#!/bin/bash
set -u
cd "$(dirname "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  echo 'Python 3 not found.'
  read -r -p 'Press Enter to close...' ignored
  exit 1
fi
if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv || exit 1
fi
if ! .venv/bin/python -c 'import certifi, pypinyin' >/dev/null 2>&1; then
  .venv/bin/python -m pip install -r requirements.txt || exit 1
fi
.venv/bin/python generate.py
status=$?
if [ "$status" -eq 0 ]; then
  open output/practice.pdf
fi
printf '\nPress Enter to close...'
read -r ignored
exit "$status"
