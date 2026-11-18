# Web version

This static browser app uses the generated `data/` copy of `shared/data/`. It does not read files from `local/`.

Hosted version: <https://khangtranminh.github.io/hanzi-writing-sheet/>. GitHub Actions deploys `web/` whenever a commit is pushed to `main`.

The home page reads the version from `version.json` in the format `YY.MM.DD.xx`. Before every commit, run `python3 scripts/web/version.py --bump`. This updates the version using the date in Vietnam and synchronizes versioned URLs across all web HTML pages. Include those changes in the commit. See the repository's `AGENTS.md` for the full commit rule.

From the project root, serve only this folder:

```sh
python3 scripts/web/run_web_local.py
```

Open <http://localhost:8000/> and choose **Tạo trang luyện viết**, **Bài học**, or **Luyện tập**. A worksheet opens in a new tab; choose **In / lưu PDF** and then **Save as PDF** in the browser print dialog.

The worksheet reads cached stroke data from `data/worksheet/` first and fetches missing characters from Hanzi Writer Data. The bundled `pinyin-pro` library provides pinyin locally.

## Practice cards

Practice cards are collected from `shared/data/lessons/`, excluding the `0000-0000.json` template. Entries with the same Hanzi are deduplicated before shuffling; the first entry in lesson order supplies the pinyin and meaning. Select a card to reveal its pinyin and meaning, then select it again to move on. Select **Luyện lại** to start a new shuffled round. Serve the folder over HTTP so the browser can load the lessons.

### Changing how cards advance

Open `web/practice/practice.js` and change the `ADVANCE_MODE` constant near the top:

```js
const ADVANCE_MODE = "manual";
```

- `"manual"`: tap once to reveal pinyin, then tap again to advance.
- `"automatic"`: advance automatically after 1.5 seconds; tapping the revealed card advances immediately.

To change the automatic delay, edit `AUTO_ADVANCE_DELAY` in the same file; its value is in milliseconds (`1500` means 1.5 seconds). Reload the page after editing.

To synchronize URLs with the current version without incrementing it, run `python3 scripts/web/version.py`. Run `python3 scripts/web/version.py --check` to detect mismatches; the deployment workflow also runs this check. Versioned URLs give browsers new URLs for updated files. The practice data is revalidated when it is loaded.

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

The catalog `lessons/index.json` is generated outside `data/` because the static site cannot list files in a directory. `0000-0000.json` is a template and is excluded from the catalog. `0001-0001.json` is an example lesson that you can edit or replace. The interface lists parts and their lessons in descending numerical order. Serve the site over HTTP to load the catalog and lessons.

## Translation exercises

Add timestamped JSON files to `shared/data/translation-exercises/`. The shared data sync generates `translation-exercises/index.json` so the static site can list the exercises. Each file contains an `exercises` array with `question`, `hanzi`, and `pinyin` strings.
