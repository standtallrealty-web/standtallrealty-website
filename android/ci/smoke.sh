#!/usr/bin/env bash
# Installs the signed app on the emulator, opens it, and saves screenshots and logs to ./smoke-out
set -x
OUT="$PWD/smoke-out"; mkdir -p "$OUT"
PKG=com.standtallrealty.app
adb wait-for-device
adb shell getprop ro.build.version.release > "$OUT/android-version.txt"
adb shell getprop ro.build.type >> "$OUT/android-version.txt"
adb shell pm list packages | grep -iE "chrome|webview|browser" > "$OUT/browsers.txt" || true
adb shell dumpsys package com.android.chrome | grep -m2 -E "versionName" >> "$OUT/browsers.txt" || true
# Skip Chrome's first-run screens (works on the emulator's userdebug image).
adb shell "echo '_ --disable-fre --no-default-browser-check --no-first-run' > /data/local/tmp/chrome-command-line"
adb shell am set-debug-app --persistent com.android.chrome || true
adb install -r android/release/stand-tall-realty.apk > "$OUT/install.txt" 2>&1; echo "exit=$?" >> "$OUT/install.txt"
adb shell dumpsys package $PKG | grep -E "versionName|versionCode|targetSdk|minSdk|signatures" > "$OUT/package.txt" || true
adb logcat -c
adb shell am start -W -n $PKG/.StartActivity > "$OUT/start.txt" 2>&1
sleep 0.5
adb exec-out screencap -p > "$OUT/0-logo.png"
sleep 3
adb exec-out screencap -p > "$OUT/0-splash.png"
sleep 30
adb exec-out screencap -p > "$OUT/1-home.png"
adb shell dumpsys activity activities | grep -E "ResumedActivity" > "$OUT/top-activity.txt" || true
adb shell pm verify-app-links --re-verify $PKG || true
sleep 15
adb shell pm get-app-links $PKG > "$OUT/app-links.txt" 2>&1 || true
# A website link, as if tapped in WhatsApp.
adb shell am start -W -a android.intent.action.VIEW -c android.intent.category.BROWSABLE -d "https://www.standtallrealty.com/properties?purpose=rent" > "$OUT/deeplink.txt" 2>&1
sleep 25
adb exec-out screencap -p > "$OUT/2-link.png"
adb shell dumpsys activity activities | grep -E "ResumedActivity" >> "$OUT/top-activity.txt" || true
# Updating from 1.1.0 (the version before update messages): the website should offer the update,
# and after installing this version over it, the message should be gone.
OLD_APK="https://raw.githubusercontent.com/standtallrealty-web/standtallrealty-website/bd9404c057916024b3ed2b5cd187daf388e5c9ee/android/release/stand-tall-realty.apk"
if curl -fsSL -o old.apk "$OLD_APK"; then
  adb uninstall $PKG > /dev/null 2>&1 || true
  adb install old.apk > "$OUT/update.txt" 2>&1; echo "install 1.1.0 exit=$?" >> "$OUT/update.txt"
  adb shell dumpsys package $PKG | grep -E "versionName|versionCode" >> "$OUT/update.txt" || true
  adb shell am start -W -n $PKG/.StartActivity >> "$OUT/update.txt" 2>&1
  sleep 40
  adb exec-out screencap -p > "$OUT/3-old-app.png"
  adb install -r android/release/stand-tall-realty.apk >> "$OUT/update.txt" 2>&1; echo "update exit=$?" >> "$OUT/update.txt"
  adb shell dumpsys package $PKG | grep -E "versionName|versionCode" >> "$OUT/update.txt" || true
  adb shell am start -W -n $PKG/.StartActivity >> "$OUT/update.txt" 2>&1
  sleep 40
  adb exec-out screencap -p > "$OUT/4-after-update.png"
fi
adb logcat -d > "$OUT/logcat-full.txt"
grep -iE "TWA|TrustedWeb|LauncherActivity|Using url|browserhelper|OriginVerifier|DigitalAsset|asset ?link|AndroidRuntime|FATAL|standtall" "$OUT/logcat-full.txt" | head -500 > "$OUT/logcat.txt" || true
gzip -f "$OUT/logcat-full.txt"
exit 0
