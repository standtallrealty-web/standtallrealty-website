#!/usr/bin/env bash
# Collects the build outputs into ./out and checks any signed files in android/release/.
set -u
T="$ANDROID_HOME/build-tools/$BUILD_TOOLS"
mkdir -p out
cp gradle.log out/ 2>/dev/null || true
A=android/app/build/outputs
if [ -f "$A/apk/release/app-release-unsigned.apk" ]; then
  cp "$A/apk/release/app-release-unsigned.apk" out/
  "$T/aapt2" dump badging out/app-release-unsigned.apk > out/badging.txt 2>&1
  "$T/aapt2" dump xmltree --file AndroidManifest.xml out/app-release-unsigned.apk > out/manifest.txt 2>&1
  "$T/zipalign" -c -p -v 4 out/app-release-unsigned.apk > out/zipalign-unsigned.txt 2>&1; echo "exit=$?" >> out/zipalign-unsigned.txt
  unzip -l out/app-release-unsigned.apk > out/apk-contents.txt
fi
if [ -f "$A/bundle/release/app-release.aab" ]; then
  cp "$A/bundle/release/app-release.aab" out/app-release-unsigned.aab
fi
BT_URL=$(curl -fsSL https://api.github.com/repos/google/bundletool/releases/latest | jq -r '.assets[] | select(.name|endswith(".jar")) | .browser_download_url' | head -1)
[ -n "$BT_URL" ] && curl -fsSL -o bundletool.jar "$BT_URL" && echo "$BT_URL" > out/bundletool-version.txt
signed=false
if [ -f android/release/stand-tall-realty.apk ]; then
  signed=true
  "$T/apksigner" verify --verbose --print-certs android/release/stand-tall-realty.apk > out/apksigner-verify.txt 2>&1; echo "exit=$?" >> out/apksigner-verify.txt
  "$T/zipalign" -c -p -v 4 android/release/stand-tall-realty.apk > out/zipalign-signed.txt 2>&1; echo "exit=$?" >> out/zipalign-signed.txt
  sha256sum android/release/stand-tall-realty.apk > out/sha256-apk.txt
fi
if [ -f android/release/stand-tall-realty.aab ]; then
  jarsigner -verify -verbose -certs android/release/stand-tall-realty.aab > out/jarsigner-aab.txt 2>&1; echo "exit=$?" >> out/jarsigner-aab.txt
  if [ -f bundletool.jar ]; then
    java -jar bundletool.jar validate --bundle=android/release/stand-tall-realty.aab > out/bundletool-validate.txt 2>&1; echo "exit=$?" >> out/bundletool-validate.txt
  fi
fi
echo "signed=$signed" >> "$GITHUB_OUTPUT"
ls -la out
