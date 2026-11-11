#!/usr/bin/env python3
"""Update pinyin on macOS using the bundled pinyin-pro.

- Default: update missing pinyin in web/practice/data.json in place.
  Example: python3 scripts/update-web-practice-pinyin.py
- --file: update a different JSON file in place.
  Example: python3 scripts/update-web-practice-pinyin.py --file private/practice.json
- --all: regenerate all pinyin, including existing values.
  Example: python3 scripts/update-web-practice-pinyin.py --all
"""

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

WEB = Path(__file__).resolve().parent.parent / 'web'
JSC = Path('/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc')


def main():
    parser = argparse.ArgumentParser(description='Update pinyin in the practice JSON using the bundled pinyin-pro.')
    parser.add_argument('--all', action='store_true', help='Replace existing pinyin too (including manual readings).')
    parser.add_argument('--file', type=Path, default=WEB / 'practice' / 'data.json', help='JSON file to update.')
    args = parser.parse_args()
    try:
        data = json.loads(args.file.read_text(encoding='utf-8'))
        if not isinstance(data, list):
            raise ValueError('JSON must contain an array.')
        indices = []
        words = []
        for i, item in enumerate(data):
            if not isinstance(item, dict) or not isinstance(item.get('hanzi'), str) or not item['hanzi'].strip():
                raise ValueError(f'Entry {i + 1} must contain a non-empty hanzi string.')
            reading = item.get('pinyin')
            if reading is not None and not isinstance(reading, str):
                raise ValueError(f'Entry {i + 1} has invalid pinyin.')
            if args.all or not reading or not reading.strip():
                indices.append(i)
                words.append(item['hanzi'].strip())
        if not indices:
            print('No pinyin needs updating.')
            return
        if not JSC.is_file():
            raise RuntimeError('JavaScriptCore was not found. This script requires macOS.')
        library = (WEB / 'assets' / 'vendor' / 'pinyin-pro.min.js').read_text(encoding='utf-8')
        code = library + '\nconst words = ' + json.dumps(words, ensure_ascii=True) + ';\n' + (
            'print(JSON.stringify(words.map(word => pinyinPro.pinyin(word))));\n'
        )
        with tempfile.TemporaryDirectory(prefix='hanzi-pinyin-') as directory:
            script = Path(directory) / 'convert.js'
            script.write_text(code, encoding='utf-8')
            result = subprocess.run([str(JSC), str(script)], text=True, capture_output=True, check=True)
        readings = json.loads(result.stdout)
        if len(readings) != len(words):
            raise ValueError('Unexpected number of pinyin results.')
        for i, word, reading in zip(indices, words, readings):
            if not isinstance(reading, str) or not reading.strip() or reading == word:
                raise ValueError(f'Could not generate pinyin for {word!r}.')
            data[i]['pinyin'] = reading
        # Write only after every entry has been successfully converted.
        args.file.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'Updated pinyin for {len(indices)} entries in {args.file}.')
    except (OSError, ValueError, RuntimeError, subprocess.CalledProcessError) as error:
        print(f'Error: {error}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
