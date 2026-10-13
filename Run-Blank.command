#!/bin/bash
set -u
cd "$(dirname "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then
  echo 'Python 3 not found.'
  read -r -p 'Press Enter to close...' ignored
  exit 1
fi
python3 generate_blank.py
status=$?
if [ "$status" -eq 0 ]; then
  open output/practice_blank.pdf
fi
printf '\nPress Enter to close...'
read -r ignored
exit "$status"
