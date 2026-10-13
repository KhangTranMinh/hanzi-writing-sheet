# Web version

This static browser app has its own `data/` stroke cache. It does not read files from `local/`.

From the project root, serve only this folder:

```sh
python3 -m http.server 8000 --directory web
```

Then open <http://localhost:8000/>. Choose Hanzi worksheet or blank page and select **Tạo trang**. The result opens in a new tab; choose **In / lưu PDF** and then **Save as PDF** in the browser print dialog.

The app reads cached stroke data from its own `data/` folder first and fetches missing characters from Hanzi Writer Data. Pinyin is provided by the pinned `pinyin-pro` script loaded from jsDelivr, so internet access is needed for uncached characters and pinyin support.
