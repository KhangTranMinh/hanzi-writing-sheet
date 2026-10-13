# Hanzi Writing Practice

The project has two separate versions. `local/` contains the Python app and its inputs; `web/` contains the browser app. Each has its own Hanzi stroke data, and neither app reads files from the other folder.

## Local version

See [local/README.md](local/README.md). On macOS, double-click `local/Run.command` or `local/Run-Blank.command`.

## Web version

See [web/README.md](web/README.md). It is a static browser app with Hanzi input and a blank-page option. The result opens in another tab so it can be printed or saved as PDF from the browser.

GitHub Actions publishes the contents of `web/` to [GitHub Pages](https://khangtranminh.github.io/hanzi-writing-sheet/) on every push to `main`.
