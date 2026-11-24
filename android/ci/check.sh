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
# The live website: download page, APK and the app link check file.
{
  echo "== /app"; curl -sS -o /dev/null -w "%{http_code} %{content_type}\n" https://www.standtallrealty.com/app
  echo "== /app/stand-tall-realty.apk"; curl -sSI https://www.standtallrealty.com/app/stand-tall-realty.apk | grep -iE "^HTTP|content-type|content-length|content-disposition|cache-control"
  curl -sS -o live.apk https://www.standtallrealty.com/app/stand-tall-realty.apk && sha256sum live.apk
  echo "== /.well-known/assetlinks.json"; curl -sS -D - https://www.standtallrealty.com/.well-known/assetlinks.json | grep -ivE "^(date|cf-|report-to|nel|server|alt-svc|vary)"
  # WhatsApp login: Meta's address check must echo the challenge; a wrong token and an unsigned POST are refused.
  echo "== /wa-hook (Meta check, right token)"; curl -sS -w "  [%{http_code}]\n" "https://www.standtallrealty.com/wa-hook?hub.mode=subscribe&hub.verify_token=standtall-whatsapp-login&hub.challenge=4242"
  echo "== /wa-hook (wrong token)"; curl -sS -o /dev/null -w "%{http_code}\n" "https://www.standtallrealty.com/wa-hook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=4242"
  echo "== /wa-hook (POST without signature)"; curl -sS -o /dev/null -w "%{http_code}\n" -X POST -d '{}' https://www.standtallrealty.com/wa-hook
  echo "== /login"; curl -sS -o /dev/null -w "%{http_code} %{content_type}\n" https://www.standtallrealty.com/login
  # login settings from the edge: the second answer should be fast (no Apps Script)
  echo "== /api/config (first)"; curl -sS -w "\n  [%{http_code}, %{time_total}s]\n" https://www.standtallrealty.com/api/config
  echo "== /api/config (again)"; curl -sS -o /dev/null -w "  [%{http_code}, %{time_total}s]\n" https://www.standtallrealty.com/api/config
  echo "== /app/version.json"; curl -sS https://www.standtallrealty.com/app/version.json
} > out/live-site.txt 2>&1
echo "signed=$signed" >> "$GITHUB_OUTPUT"
ls -la out
