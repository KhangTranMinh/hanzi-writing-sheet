#!/usr/bin/env python3
"""Run Git or GitHub CLI with the project token without storing it in Git config.

- Push the current branch: python3 scripts/github/github.py git push origin HEAD
- Create a PR: python3 scripts/github/github.py gh pr create --base main --head BRANCH --title TITLE --body BODY
- Read repo information: python3 scripts/github/github.py gh api repos/KhangTranMinh/hanzi-writing-sheet

Set GITHUB_TOKEN in the repository root .env. The token is passed to child
processes through their environment, never placed in a URL or command argument.
"""
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def read_token():
    """Read the token as data, without executing the contents of .env."""
    for line in (ROOT / '.env').read_text(encoding='utf-8').splitlines():
        key, sep, value = line.partition('=')
        if sep and key.strip() == 'GITHUB_TOKEN':
            token = value.strip()
            if len(token) >= 2 and token[0] == token[-1] and token[0] in "\"'":
                token = token[1:-1]
            if token and '\n' not in token and '\r' not in token:
                return token
            break
    raise ValueError('GITHUB_TOKEN is missing or empty in .env.')


def main():
    if len(sys.argv) < 3 or sys.argv[1] not in ('git', 'gh'):
        print('Usage: python3 scripts/github/github.py {git|gh} <arguments...>', file=sys.stderr)
        return 2
    try:
        token = read_token()
        env = os.environ.copy()
        env['PROJECT_GITHUB_TOKEN'] = token
        env['GH_TOKEN'] = token
        env['GIT_ASKPASS'] = str(ROOT / 'scripts' / 'github' / '_github-askpass.py')
        env['GIT_TERMINAL_PROMPT'] = '0'
        if sys.argv[1] == 'git':
            # Reset inherited helpers so stale stored credentials cannot take precedence.
            command = ['git', '-c', 'credential.helper=', *sys.argv[2:]]
        else:
            # Also disable helpers if gh invokes Git to push a branch.
            env['GIT_CONFIG_COUNT'] = '1'
            env['GIT_CONFIG_KEY_0'] = 'credential.helper'
            env['GIT_CONFIG_VALUE_0'] = ''
            command = ['gh', *sys.argv[2:]]
        return subprocess.run(command, env=env).returncode
    except (OSError, ValueError) as error:
        print(f'Error: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
