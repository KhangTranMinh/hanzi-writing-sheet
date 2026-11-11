#!/usr/bin/env python3
"""Supply credentials only to Git prompts for github.com."""
import os
import re
import sys
from urllib.parse import urlparse

prompt = sys.argv[1].lower() if len(sys.argv) > 1 else ''
match = re.search(r"'([^']+)'", prompt)
if not match or urlparse(match.group(1)).hostname != 'github.com':
    sys.exit(1)
if prompt.startswith('username'):
    print('x-access-token')
elif prompt.startswith('password'):
    print(os.environ['PROJECT_GITHUB_TOKEN'])
else:
    sys.exit(1)
