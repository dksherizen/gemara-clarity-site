#!/bin/sh
# Copies the site and every lesson into the app (android/app/src/main/assets/site). Run from the repo root before building.
set -e
D=android/app/src/main/assets/site
rm -rf "$D" && mkdir -p "$D"
cp index.html gc.css app.js acct.js mywords.js mishnah.js manifest.json favicon.svg favicon-32.png logo-mark.svg icon-192.png icon-512.png apple-touch-icon.png "$D"/
cp -r fonts img ameilus about privacy data "$D"/
rm -f "$D"/data/classics-draft.json
echo "Copied $(find "$D" -type f | wc -l) files into the app."
