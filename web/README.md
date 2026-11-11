# Web version

This static browser app has its own `worksheet/data/` stroke cache. It does not read files from `local/`.

Hosted version: <https://khangtranminh.github.io/hanzi-writing-sheet/>. GitHub Actions deploys `web/` whenever a commit is pushed to `main`.

The home page reads the version from `version.json` in the format `YY.MM.DD.xx`. Before every commit, update it using the date in Vietnam: increment `xx` on the same day, or start at `01` on a new day. This is a manual step; commits and deployments do not change it automatically. See the repository's `AGENTS.md` for the full commit rule.

From the project root, serve only this folder:

```sh
python3 -m http.server 8000 --directory web
```

Open <http://localhost:8000/> and choose **Tạo trang luyện viết** or **Luyện tập**. The worksheet opens in a new tab; choose **In / lưu PDF** and then **Save as PDF** in the browser print dialog.

The worksheet reads cached stroke data from `worksheet/data/` first and fetches missing characters from Hanzi Writer Data. The bundled `pinyin-pro` library provides pinyin locally.

## Practice cards

Edit `practice/data.json` to change the cards. It is a JSON array of objects with a required non-empty `hanzi` string and an optional `pinyin` string:

```json
[
  { "hanzi": "你好" },
  { "hanzi": "中国", "pinyin": "zhōng guó" }
]
```

Missing or blank pinyin is generated locally with `pinyin-pro` for the whole word. Supply pinyin explicitly when a particular reading is needed. After the cards are prepared, they are shuffled. Select a card to reveal its pinyin, then select it again to move on. At the end, select **Luyện lại** to start a new shuffled round. Serve the folder over HTTP as shown above so the browser can load the JSON file.

### Changing how cards advance

Open `web/practice/practice.js` and change the `ADVANCE_MODE` constant near the top:

```js
const ADVANCE_MODE = "manual";
```

- `"manual"`: tap once to reveal pinyin, then tap again to advance.
- `"automatic"`: advance automatically after 1.5 seconds; tapping the revealed card advances immediately.

To change the automatic delay, edit `AUTO_ADVANCE_DELAY` in the same file; its value is in milliseconds (`1500` means 1.5 seconds). Reload the page after editing.

When updating the version, also change the `v` query value on the practice link and stylesheet in `index.html`, and the stylesheet and script references in `practice/index.html`, to match. This gives browsers new URLs for updated files. The practice data is revalidated when it is loaded.

Run the script from the project root on macOS. It uses the bundled `pinyin-pro` and JavaScriptCore; it does not need network access or Node.js. Each command updates its input file in place:

- **Default:** fill missing pinyin in `web/practice/data.json`, preserving existing values.
  `python3 scripts/update-web-practice-pinyin.py`
- **`--file`:** update a different JSON file, preserving existing values.
  `python3 scripts/update-web-practice-pinyin.py --file private/practice.json`
- **`--all`:** regenerate every pinyin value in the default file.
  `python3 scripts/update-web-practice-pinyin.py --all`
