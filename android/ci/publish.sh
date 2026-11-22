#!/usr/bin/env bash
# Copies a folder of results to the android-builds branch: publish.sh <folder> <path-in-branch>
set -euo pipefail
SRC=$(realpath "$1"); DEST="$2"; BR=android-builds
[ -d "$SRC" ] || { echo "nothing to publish"; exit 0; }
REMOTE="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
git config --global user.name "github-actions[bot]"
git config --global user.email "41898282+github-actions[bot]@users.noreply.github.com"
for attempt in 1 2 3 4 5; do
  WORK=$(mktemp -d); cd "$WORK"
  if git clone -q --depth 1 --branch "$BR" "$REMOTE" repo 2>/dev/null; then cd repo
  else mkdir repo; cd repo; git init -q; git checkout -q --orphan "$BR"; git remote add origin "$REMOTE"; fi
  mkdir -p "$DEST"; cp -r "$SRC"/. "$DEST"/
  git add -A
  git commit -q -m "Android results: $DEST" || exit 0
  if git push -q origin "HEAD:$BR"; then echo "published to $BR/$DEST"; exit 0; fi
  sleep $((attempt * 5))
done
exit 1
