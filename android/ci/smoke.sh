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
adb logcat -d > "$OUT/logcat-full.txt"
grep -iE "TWA|TrustedWeb|LauncherActivity|browserhelper|OriginVerifier|DigitalAsset|asset ?link|AndroidRuntime|FATAL|standtall" "$OUT/logcat-full.txt" | head -500 > "$OUT/logcat.txt" || true
gzip -f "$OUT/logcat-full.txt"
exit 0
