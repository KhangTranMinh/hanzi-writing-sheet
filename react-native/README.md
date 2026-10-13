# React Native app

This is an independent Expo + React Native project for Android and iOS. It does not share runtime code or data files with `local/` or `web/`.

## Start developing

```sh
npm start
```

The app creates Hanzi practice sheets or blank writing pages. To start Expo and open the Android emulator or iOS simulator, use:

```sh
npm run android
npm run ios
```

The app bundles stroke data for the characters in `data/`. Other characters are loaded from Hanzi Writer Data (`2.0.1`), so internet access is needed for those characters. A progress dialog appears while a worksheet is generated or missing stroke data is downloaded. When it is ready, a native bottom sheet offers print/save as PDF or share PDF; swipe it down to dismiss.

The project uses Expo Router, Expo Print, and Expo Sharing. After adding native modules or changing their configuration, regenerate the native project and rebuild the development app:

```sh
npx expo prebuild --platform android
npx expo run:android
```
