# Stand Tall Realty for Android

The app is a Trusted Web Activity. It opens https://www.standtallrealty.com full screen in Chrome,
with no address bar. Every website change shows in the app at once, so a new app version is only
needed to change the icon, name, splash screen or Android target level.

- Package name: `com.standtallrealty.app`
- Website link check: `/.well-known/assetlinks.json`, served by `worker/index.mjs`
- Shortcuts (long-press the icon): Buy a home, Rent a home, Sell my property, Free price check

## How a version is made

1. Change `versionCode` (+1) and `versionName` in `app/build.gradle` and push.
2. The "Android app" GitHub workflow builds an unsigned APK and app bundle and saves them in the
   `android-builds` branch, folder `runs/<commit>/build/`.
3. On a private machine, sign them with the upload key (never commit the key):
   - APK: `python3 tools/sign_apk.py --ks upload.p12 --pass-file password.txt --in app-release-unsigned.apk --out release/stand-tall-realty.apk`
   - App bundle: `jarsigner -keystore upload.p12 -storetype PKCS12 -digestalg SHA-256 -sigalg SHA256withRSA -signedjar release/stand-tall-realty.aab app-release-unsigned.aab standtall`
4. Push `release/`. The workflow checks both files with Google's apksigner and bundletool, opens
   the app on an Android emulator and saves screenshots in `runs/<commit>/smoke/`.
5. Copy the APK to `site/app/stand-tall-realty.apk` for the download page, and upload the
   `.aab` file to Google Play.

## Images

`python3 tools/make_images.py <site-folder> <android-folder> [<store-folder>]` makes the launcher
icons and splash screen from the website's logo files, plus the Play Store icon and feature graphic.

## Google Play

When the app is first uploaded, Play signs it with its own key. Play Console shows that key's
SHA-256 fingerprint under Test and release > App integrity. Add it to `ANDROID_APP_FINGERPRINTS`
in `worker/index.mjs`, so the app also opens full screen when installed from Play.
