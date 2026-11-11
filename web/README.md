# Web version

This static browser app has its own `data/` stroke cache. It does not read files from `local/`.

Hosted version: <https://khangtranminh.github.io/hanzi-writing-sheet/>. GitHub Actions deploys `web/` whenever a commit is pushed to `main`.

From the project root, serve only this folder:

```sh
python3 -m http.server 8000 --directory web
```

Open <http://localhost:8000/> and choose **Tạo trang luyện viết** or **Luyện tập**. The worksheet opens in a new tab; choose **In / lưu PDF** and then **Save as PDF** in the browser print dialog.

The worksheet reads cached stroke data from `data/` first and fetches missing characters from Hanzi Writer Data. The bundled `pinyin-pro` library provides pinyin locally.

## Practice cards

Edit `practice-data.json` to change the cards. It is a JSON array of objects with a required non-empty `hanzi` string and an optional `pinyin` string:

```json
[
  { "hanzi": "你好" },
  { "hanzi": "中国", "pinyin": "zhōng guó" }
]
```

Missing or blank pinyin is generated locally with `pinyin-pro` for the whole word. Supply pinyin explicitly when a particular reading is needed. After the cards are prepared, they are shuffled. Select a card to reveal its pinyin; the transition to the next card starts after 1.5 seconds. At the end, select **Luyện lại** to start a new shuffled round. Serve the folder over HTTP as shown above so the browser can load the JSON file.
