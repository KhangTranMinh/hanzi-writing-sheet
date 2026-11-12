# React Native app

This Expo + React Native app for Android and iOS uses data from `../shared/data/`, also used by the web app. Data is copied into the app bundle by `scripts/shared_data/publish_shared_data.py`. The app receives new data with a new build; it does not fetch lessons or practice cards remotely.

## Start developing

Install Node.js, npm, and Python 3, then install dependencies from the `react-native/` directory:

```sh
npm ci
```

Start the development server from the same directory:

```sh
npm start
```

The app offers writing sheets, lessons, and practice cards. Parts and lessons appear in descending numerical order. The npm start, android, ios, and web scripts first sync shared data automatically. After editing shared data while the server is running, restart it. Before other build commands (including cloud builds), run `python3 ../scripts/shared_data/publish_shared_data.py` and include the generated app data in the build. To build and run the native app on an Android emulator or iOS simulator, use the appropriate command below. This requires the corresponding Android or iOS development tools:

```sh
npm run android
npm run ios
```

The app bundles stroke data for the characters in `data/worksheet/`. Other characters are loaded from Hanzi Writer Data (`2.0.1`), so internet access is needed for those characters. A progress dialog appears while a worksheet is generated or missing stroke data is downloaded. When it is ready, a native bottom sheet offers print/save as PDF or share PDF; swipe it down to dismiss.

The project uses Expo Router, Expo Print, and Expo Sharing. After adding native modules or changing their configuration, regenerate the native project and rebuild the development app:

```sh
npx expo prebuild --platform android
npx expo run:android
```
