#!/usr/bin/env python3
"""Update pinyin and English meanings in web practice data on macOS.

- Default: update missing pinyin and meanings in web/practice/data.json in place.
  Example: python3 scripts/web-practice-data/run.py
- --file: update a different JSON file in place.
  Example: python3 scripts/web-practice-data/run.py --file private/practice.json
- --all: regenerate pinyin and meanings, including existing values.
  Example: python3 scripts/web-practice-data/run.py --all
- --refresh: download a fresh CC-CEDICT dictionary before updating meanings.
  Example: python3 scripts/web-practice-data/run.py --refresh

CC-CEDICT is stored in scripts/web-practice-data/; --refresh requires network access.
Only exact dictionary matches are used, and unmatched entries are reported.
"""
import argparse
import json
import re
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / 'web'
DEFAULT_FILE = WEB / 'practice' / 'data.json'
JSC = Path('/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc')
PINYIN_LIBRARY = WEB / 'assets' / 'vendor' / 'pinyin-pro' / 'pinyin-pro.min.js'
DICTIONARY_CACHE = ROOT / 'scripts' / 'web-practice-data' / 'cc-cedict.u8'
DICTIONARY_URL = 'https://raw.githubusercontent.com/liamsaliba/cc-cedict-stardict/main/data/cedict_ts.u8'
DICTIONARY_ENTRY = re.compile(r'^([^\s]+)\s+([^\s]+)\s+\[[^\]]+\]\s+/(.+)/\s*$')


def read_practice_data(path):
    """Load and validate the JSON before making any changes."""
    data = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(data, list):
        raise ValueError('JSON must contain an array.')
    for i, item in enumerate(data, start=1):
        if not isinstance(item, dict) or not isinstance(item.get('hanzi'), str) or not item['hanzi'].strip():
            raise ValueError(f'Entry {i} must contain a non-empty hanzi string.')
        for field in ('pinyin', 'meaning'):
            if item.get(field) is not None and not isinstance(item[field], str):
                raise ValueError(f'Entry {i} has invalid {field}; expected a string.')
    return data


def update_pinyin(data, replace_existing):
    """Generate readings in one JavaScriptCore invocation; preserve existing by default."""
    pending = [item for item in data if replace_existing or not (item.get('pinyin') or '').strip()]
    if not pending:
        print('No pinyin needs updating.')
        return 0
    if not JSC.is_file():
        raise RuntimeError('JavaScriptCore was not found. This script requires macOS.')
    words = [item['hanzi'].strip() for item in pending]
    library = PINYIN_LIBRARY.read_text(encoding='utf-8')
    code = library + '\nconst words = ' + json.dumps(words, ensure_ascii=True) + ';\n' + (
        'print(JSON.stringify(words.map(word => pinyinPro.pinyin(word))));\n'
    )
    with tempfile.TemporaryDirectory(prefix='hanzi-pinyin-') as directory:
        script = Path(directory) / 'convert.js'
        script.write_text(code, encoding='utf-8')
        result = subprocess.run([str(JSC), str(script)], text=True, capture_output=True, check=True)
    readings = json.loads(result.stdout)
    if not isinstance(readings, list) or len(readings) != len(words):
        raise ValueError('Unexpected number of pinyin results.')
    for item, word, reading in zip(pending, words, readings):
        if not isinstance(reading, str) or not reading.strip() or reading == word:
            raise ValueError(f'Could not generate pinyin for {word!r}.')
        item['pinyin'] = reading
    print(f'Updated pinyin for {len(pending)} entries.')
    return len(pending)


def load_dictionary(refresh):
    """Download or reuse CC-CEDICT, indexing exact simplified and traditional words."""
    if refresh or not DICTIONARY_CACHE.is_file():
        print('Downloading CC-CEDICT to the local dictionary file...')
        request = urllib.request.Request(DICTIONARY_URL, headers={'User-Agent': 'HanziWritingPractice/1.0'})
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read()
        text = raw.decode('utf-8-sig')
        if 'CC-CEDICT' not in text[:2000]:
            raise ValueError('Downloaded file is not a CC-CEDICT dictionary.')
    else:
        raw = None
        text = DICTIONARY_CACHE.read_text(encoding='utf-8-sig')
    dictionary = {}
    for line in text.splitlines():
        match = DICTIONARY_ENTRY.match(line)
        if not match:
            continue
        traditional, simplified, definitions = match.groups()
        senses = [sense.strip() for sense in definitions.split('/') if sense.strip()]
        for word in {traditional, simplified}:
            entries = dictionary.setdefault(word, [])
            for sense in senses:
                if sense not in entries:
                    entries.append(sense)
    if not dictionary:
        raise ValueError('CC-CEDICT contains no readable entries.')
    if raw is not None:
        DICTIONARY_CACHE.parent.mkdir(parents=True, exist_ok=True)
        DICTIONARY_CACHE.write_bytes(raw)
    return dictionary


def update_meanings(data, refresh, replace_existing):
    """Fill or replace meanings from exact matches; preserve unmatched values."""
    pending = [item for item in data if replace_existing or not (item.get('meaning') or '').strip()]
    if not pending and not refresh:
        print('No meanings need updating.')
        return 0
    dictionary = load_dictionary(refresh)
    unmatched = []
    updated = 0
    for item in pending:
        word = item['hanzi'].strip()
        senses = dictionary.get(word)
        if not senses:
            unmatched.append(word)
            continue
        item['meaning'] = '; '.join(senses)
        updated += 1
    print(f'Updated {updated} meanings; {len(unmatched)} not found.')
    if unmatched:
        print('Not found: ' + ', '.join(unmatched))
    return updated


def main():
    parser = argparse.ArgumentParser(description='Update pinyin and English meanings in practice data.')
    parser.add_argument('--file', type=Path, default=DEFAULT_FILE, help='JSON file to update in place.')
    parser.add_argument('--all', action='store_true', help='Regenerate pinyin and meanings, including existing values.')
    parser.add_argument('--refresh', action='store_true', help='Download CC-CEDICT again.')
    args = parser.parse_args()
    try:
        data = read_practice_data(args.file)
        pinyin_count = update_pinyin(data, args.all)
        meaning_count = update_meanings(data, args.refresh, args.all)
        # Write the input only once both updates have succeeded.
        if pinyin_count or meaning_count:
            args.file.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    except (OSError, ValueError, RuntimeError, subprocess.CalledProcessError) as error:
        print(f'Error: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
