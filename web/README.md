# Web version

This static browser app uses the generated `data/` copy of `shared/data/`. It does not read files from `local/`.

Hosted version: <https://khangtranminh.github.io/hanzi-writing-sheet/>. GitHub Actions deploys `web/` whenever a commit is pushed to `main`.

The home page reads the version from `version.json` in the format `YY.MM.DD.xx`. Before every commit, update it using the date in Vietnam: increment `xx` on the same day, or start at `01` on a new day. This is a manual step; commits and deployments do not change it automatically. See the repository's `AGENTS.md` for the full commit rule.

From the project root, serve only this folder:

```sh
python3 scripts/web/run_web_local.py
```

Open <http://localhost:8000/> and choose **Tạo trang luyện viết** or **Luyện tập**. The worksheet opens in a new tab; choose **In / lưu PDF** and then **Save as PDF** in the browser print dialog.

The worksheet reads cached stroke data from `data/worksheet/` first and fetches missing characters from Hanzi Writer Data. The bundled `pinyin-pro` library provides pinyin locally.

## Practice cards

Edit `shared/data/practice/data.json` at the project root to change the cards. It is a JSON array of objects with a required non-empty `hanzi` string and optional `pinyin` and `meaning` strings:

```json
[
  { "hanzi": "你好" },
  { "hanzi": "中国", "pinyin": "zhōng guó", "meaning": "Trung Quốc" }
]
```

Missing or blank pinyin is generated locally with `pinyin-pro` for the whole word. Supply pinyin explicitly when a particular reading is needed. After the cards are prepared, they are shuffled. Select a card to reveal its pinyin and any non-empty meaning, then select it again to move on. At the end, select **Luyện lại** to start a new shuffled round. Serve the folder over HTTP as shown above so the browser can load the JSON file.

### Changing how cards advance

Open `web/practice/practice.js` and change the `ADVANCE_MODE` constant near the top:

```js
const ADVANCE_MODE = "manual";
```

- `"manual"`: tap once to reveal pinyin, then tap again to advance.
- `"automatic"`: advance automatically after 1.5 seconds; tapping the revealed card advances immediately.

To change the automatic delay, edit `AUTO_ADVANCE_DELAY` in the same file; its value is in milliseconds (`1500` means 1.5 seconds). Reload the page after editing.

When updating the version, also change the `v` query value on the practice link and stylesheet in `index.html`, the stylesheet and script references in `practice/index.html`, and the script reference in `worksheet/index.html`, to match. This gives browsers new URLs for updated files. The practice data is revalidated when it is loaded.

### Updating practice data

Run the local script from the project root on macOS to fill missing pinyin and English meanings. It preserves existing values and updates its input file in place:

- **Default:** update `shared/data/practice/data.json`.
  `python3 scripts/update_practice_data/run.py`
- **`--file`:** update a different JSON file.
  `python3 scripts/update_practice_data/run.py --file private/practice.json`
- **`--all`:** regenerate pinyin and English meanings, including existing values. If a word is not found in the dictionary, its existing meaning is kept and the word is reported.
  `python3 scripts/update_practice_data/run.py --all`
- **`--refresh`:** download a fresh CC-CEDICT dictionary before updating meanings.
  `python3 scripts/update_practice_data/run.py --refresh`

Pinyin uses the bundled `pinyin-pro` and macOS JavaScriptCore. English meanings use exact dictionary matches; unmatched entries are listed and left unchanged. Review suggestions because dictionary entries can have multiple meanings and do not account for context. The repository includes CC-CEDICT in `scripts/update_practice_data/`, so the script can run offline. Use `--refresh` to download an updated copy.

Dictionary data is from [CC-CEDICT](https://cc-cedict.org/), published by MDBG and its contributors, under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The script downloads a copy from [cc-cedict-stardict](https://github.com/liamsaliba/cc-cedict-stardict). Meanings added from the dictionary retain that attribution and license.

## Lessons

Add lesson files in `shared/data/lessons/` at the project root, named `0001-0001.json`, `0001-0002.json`, and so on. The first four digits identify the part and the last four identify the lesson. Each file is a JSON object with a non-empty `title` and an `items` array. Every item becomes a card and must have non-empty `hanzi`, `pinyin`, and `meaning` strings:

```json
{
  "title": "Chào hỏi",
  "items": [
    { "hanzi": "你好", "pinyin": "nǐ hǎo", "meaning": "xin chào" },
    { "hanzi": "谢谢", "pinyin": "xiè xie", "meaning": "cảm ơn" }
  ]
}
```

Shared data is synced automatically when starting the web server and in GitHub Actions. To sync manually while the server is running, run:

```sh
python3 scripts/shared_data/publish_shared_data.py
```

The catalog `lessons/index.json` is generated outside `data/` because the static site cannot list files in a directory. `0000-0000.json` is a template and is excluded from the catalog. `0001-0001.json` is an example lesson that you can edit or replace. Serve the site over HTTP to load the catalog and lessons.
