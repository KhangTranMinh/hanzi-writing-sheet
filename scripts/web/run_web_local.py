#!/usr/bin/env python3
"""Sync shared data and serve the web app locally."""
import os
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[2]
subprocess.run([sys.executable, str(root / 'scripts/shared_data/publish_shared_data.py')], check=True)
os.execv(sys.executable, [sys.executable, '-m', 'http.server', '8000', '--directory', str(root / 'web')])
