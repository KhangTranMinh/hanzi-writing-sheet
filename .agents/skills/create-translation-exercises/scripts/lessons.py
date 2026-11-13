#!/usr/bin/env python3
"""List lesson vocabulary or validate a translation exercise JSON file.

Run from the repository root:
  python3 .agents/skills/create-translation-exercises/scripts/lessons.py list
  python3 .agents/skills/create-translation-exercises/scripts/lessons.py --lesson 0001-0001 list
  python3 .agents/skills/create-translation-exercises/scripts/lessons.py --lesson 0001-0001 --lesson 0001-0002 list
  python3 .agents/skills/create-translation-exercises/scripts/lessons.py check path/to/exercises.json --count 10
  python3 .agents/skills/create-translation-exercises/scripts/lessons.py --lesson 0001-0001 check path/to/exercises.json

Repeat --lesson to select lessons; omit it to use all lessons except the template.
Place --lesson before the list or check command. --count optionally checks the
expected exercise count. Run with --help to see all options.
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
LESSONS = ROOT / 'shared' / 'data' / 'lessons'
ID = re.compile(r'^\d{4}-\d{4}$')


def load_lessons(selected):
    ids = sorted(selected) if selected else sorted(p.stem for p in LESSONS.glob('*.json') if ID.fullmatch(p.stem) and p.stem != '0000-0000')
    if any(not ID.fullmatch(i) or i == '0000-0000' for i in ids):
        raise ValueError('Lesson IDs must have the form NNNN-NNNN and cannot be the template.')
    vocabulary = []
    for lesson_id in ids:
        lesson = json.loads((LESSONS / f'{lesson_id}.json').read_text(encoding='utf-8'))
        if not isinstance(lesson, dict) or not isinstance(lesson.get('items'), list):
            raise ValueError(f'Invalid lesson: {lesson_id}')
        for item in lesson['items']:
            if not isinstance(item, dict) or any(not isinstance(item.get(k), str) or not item[k].strip() for k in ('hanzi', 'pinyin', 'meaning')):
                raise ValueError(f'Invalid entry in lesson {lesson_id}')
            vocabulary.append({k: item[k].strip() for k in ('hanzi', 'pinyin', 'meaning')})
    return vocabulary


def segments(sentence, words):
    # Ignore punctuation and whitespace in both entries and answers, but preserve all words.
    clean = lambda text: ''.join(c for c in text if not c.isspace() and not unicodedata.category(c).startswith('P'))
    text = clean(sentence)
    words = {clean(word) for word in words} - {''}
    positions = {0}
    for i in range(len(text)):
        if i in positions:
            positions.update(i + len(word) for word in words if text.startswith(word, i))
    return bool(text) and len(text) in positions


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lesson', action='append', default=[], metavar='NNNN-NNNN', help='Restrict vocabulary to this lesson; repeat to select multiple lessons.')
    sub = parser.add_subparsers(dest='command', required=True)
    sub.add_parser('list', help='Print lesson vocabulary as JSON.')
    check = sub.add_parser('check', help='Validate JSON fields, exercise count, and allowed Chinese vocabulary.')
    check.add_argument('file', type=Path)
    check.add_argument('--count', type=int, help='Expected number of exercises.')
    args = parser.parse_args()
    try:
        vocab = load_lessons(args.lesson)
        if args.command == 'list':
            print(json.dumps(vocab, ensure_ascii=False, indent=2))
            return 0
        data = json.loads(args.file.read_text(encoding='utf-8'))
        if not isinstance(data, dict) or not isinstance(data.get('created_at'), str) or not data['created_at'].strip() or not isinstance(data.get('exercises'), list):
            raise ValueError('Expected an object with non-empty created_at and an exercises array.')
        entries = data['exercises']
        if args.count is not None and len(entries) != args.count:
            raise ValueError(f'Expected {args.count} exercises; found {len(entries)}.')
        for i, entry in enumerate(entries, 1):
            if not isinstance(entry, dict) or any(not isinstance(entry.get(k), str) or not entry[k].strip() for k in ('question', 'hanzi', 'pinyin')):
                raise ValueError(f'Exercise {i}: question, hanzi and pinyin must be non-empty strings.')
            if not segments(entry['hanzi'], [v['hanzi'] for v in vocab]):
                raise ValueError(f'Exercise {i}: Chinese cannot be formed from the selected lesson entries.')
        print(f'Validated {len(entries)} exercises against {len(vocab)} lesson entries. Review meaning and pinyin separately.')
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f'Error: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
