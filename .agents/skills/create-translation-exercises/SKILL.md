---
name: create-translation-exercises
description: Create Vietnamese-to-Chinese translation exercises using only vocabulary from this project's shared/data/lessons. Use when asked to make translation sentences from the lessons.
---

# Create Vietnamese-to-Chinese translation exercises

Read the JSON files in `shared/data/lessons/` at the project root, excluding `0000-0000.json`. Lesson filenames use `PPPP-LLLL.json`: the first four digits identify the part, and the last four identify a lesson within that part. For example, `0001-0001.json` is part 1, lesson 1; a part can contain multiple lessons. When the user selects particular lessons or parts, treat them as the focus of the exercises, while allowing vocabulary from all lessons to form sentences. Use each item's `hanzi`, `pinyin`, and `meaning` as the vocabulary source, and reread the data each time so it stays current. Use the bundled script to retrieve all vocabulary and, separately, the vocabulary of the focused lessons:

```bash
python3 .agents/skills/create-translation-exercises/scripts/lessons.py list
python3 .agents/skills/create-translation-exercises/scripts/lessons.py --lesson 0001-0001 list
```

Repeat `--lesson` for multiple lessons.

When the user selects a **part or lesson**, identify its vocabulary and prioritize practicing those entries throughout the exercises. A selected part includes all lessons with that part prefix. Selection identifies the practice focus, not a vocabulary restriction: entries from every lesson remain available to form natural sentences. Load the focused lessons separately to identify their vocabulary, and validate the completed exercises against all lessons. If the focus cannot be adequately represented, explain the limitation.

Create the number of natural sentences requested by the user, or 10 if no number is specified. Make them appropriate to the user's level and request. Every Chinese sentence must consist exclusively of complete `hanzi` entries from the project lessons. Never use Chinese words, particles, or characters from outside those entries, even when they would make a sentence more natural. Ordinary punctuation is allowed. Do not treat part of a multi-character entry as an independent word unless that part is also a separate entry. Entries may be reused and arranged in a different order.

Save one UTF-8 JSON file in `shared/data/translation-exercises/`. Create the directory if needed. Use the current date and time in the `Asia/Ho_Chi_Minh` timezone; name the file `YYYY-MM-DD_HH-mm-ss.json` and add a numeric suffix if needed to avoid overwriting an existing file. Include a human-readable creation time and an array of objects with Vietnamese, Chinese answer, and pinyin answer, using this format:

```json
{
  "created_at": "13/11/2026 15:30:00 (Asia/Ho_Chi_Minh)",
  "exercises": [
    {
      "question": "Xin chào",
      "hanzi": "你好",
      "pinyin": "nǐ hǎo"
    }
  ]
}
```

The example illustrates the format only; all generated vocabulary must come from the allowed lessons. The Vietnamese must match the Chinese sentence. The pinyin must reflect the readings of the entries used, including neutral tones and tone changes where appropriate. Handle proper names and punctuation appropriately. Tell the user where the file was saved.

After saving, validate the JSON, count, and vocabulary against all lessons with `python3 .agents/skills/create-translation-exercises/scripts/lessons.py check <file> --count <number>`. Correct any failures. The script does not verify naturalness, pinyin, or meaning, so review those separately. If the vocabulary cannot support natural sentences or the requested number of sentences, provide only valid examples and explain the limitation; do not introduce outside vocabulary.
