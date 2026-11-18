#!/usr/bin/env python3
"""Update or check versioned URLs throughout the web app."""
import argparse
import json
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

WEB = Path(__file__).resolve().parents[2] / 'web'
VERSION_FILE = WEB / 'version.json'
VERSION_PATTERN = re.compile(r'^\d{2}\.\d{2}\.\d{2}\.\d{2,}$')
QUERY = re.compile(r'([?&]v=)([^&#"\'\s<>]+)')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bump', action='store_true', help='increment the version for a commit')
    parser.add_argument('--check', action='store_true', help='report mismatches without changing files')
    args = parser.parse_args()
    if args.bump and args.check:
        parser.error('--bump and --check cannot be combined')

    data = json.loads(VERSION_FILE.read_text(encoding='utf-8'))
    version = data['version']
    if not isinstance(version, str) or not VERSION_PATTERN.fullmatch(version):
        raise ValueError('Invalid version in web/version.json')
    if args.bump:
        today = datetime.now(ZoneInfo('Asia/Ho_Chi_Minh')).strftime('%y.%m.%d')
        build = int(version.rsplit('.', 1)[1]) + 1 if version.startswith(today + '.') else 1
        version = f'{today}.{build:02d}'
        data['version'] = version
        VERSION_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    mismatches = []
    for path in sorted(WEB.rglob('*.html')):
        original = path.read_text(encoding='utf-8')
        updated = QUERY.sub(lambda match: match.group(1) + version, original)
        if original != updated:
            mismatches.append(str(path.relative_to(WEB)))
            if not args.check:
                path.write_text(updated, encoding='utf-8')
    if args.check and mismatches:
        print('Version mismatch: ' + ', '.join(mismatches))
        raise SystemExit(1)
    print(f'Web version {version}: ' + ('checked' if args.check else 'synchronized'))


if __name__ == '__main__':
    main()
