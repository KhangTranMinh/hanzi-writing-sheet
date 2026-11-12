# Hanzi Learning

The project has three apps: `local/` contains the Python app and its inputs, `web/` contains the browser app, and `react-native/` contains the Android/iOS app. Web and React Native share learning data from `shared/data/`; the local Python app maintains its own inputs.

## GitHub authentication

For a new checkout, create a root `.env` file containing `GITHUB_TOKEN=your_token`. This file is ignored by Git. The token must have access to this repository and the permissions needed for the action (for example, repository contents write for push and pull requests write for creating PRs). Install Python 3 and Git. Install [GitHub CLI](https://cli.github.com/) if you need to run GitHub commands.

No per-repository credential helper setup is needed. Project instructions in `AGENTS.md` describe how to authenticate Git and GitHub CLI commands. Do not put the token in commands, URLs, or tracked files.

## Local version

See [local/README.md](local/README.md). On macOS, double-click `local/Run.command` or `local/Run-Blank.command`.

## Web version

See [web/README.md](web/README.md). This static browser app offers printable writing sheets, lessons, and practice cards. Writing sheets open in another tab so they can be printed or saved as PDF.

GitHub Actions publishes the contents of `web/` to [GitHub Pages](https://khangtranminh.github.io/hanzi-writing-sheet/) on every push to `main`.

## React Native app

See [react-native/README.md](react-native/README.md). This Expo project is a mobile app for Android and iOS that shares learning data with the web app.

## Shared data

Edit lessons, practice cards and worksheet stroke data under `shared/data/`. The web server command, GitHub Pages workflow and React Native npm start/android/ios/web commands sync it automatically. Run `python3 scripts/shared_data/publish_shared_data.py` before other builds or after editing data while a server is running. Each sync replaces `web/data/` and `react-native/data/` with complete copies of `shared/data/`; generated files are build inputs, not the source of truth. See the app READMEs for details.
