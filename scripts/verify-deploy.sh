#!/usr/bin/env bash
# Polls a deployed page until it serves the build in a local dist/ folder.
#
#   scripts/verify-deploy.sh <page-url> [dist-dir]
#
# "Serves the build" = the live index.html has the same <meta name="version"> as dist/index.html
# and references the same assets/index-*.js. The script name is a content hash, so this also
# catches a redeploy that kept the same version number. Exits 1 if that doesn't happen within
# TIMEOUT seconds (default 300), polling every INTERVAL seconds (default 15).
set -euo pipefail

url="${1:?usage: verify-deploy.sh <page-url> [dist-dir]}"
dist="${2:-dist}"
timeout="${TIMEOUT:-300}"
interval="${INTERVAL:-15}"

version=$(sed -n 's/.*<meta name="version" content="\([^"]*\)".*/\1/p' "$dist/index.html" | head -n1)
script=$(grep -o 'assets/index-[A-Za-z0-9_-]*\.js' "$dist/index.html" | head -n1)
if [ -z "$version" ] || [ -z "$script" ]; then
  echo "::error::Could not read the version meta or the script name from $dist/index.html"
  exit 1
fi
echo "Waiting for $url to serve version $version ($script)"

deadline=$((SECONDS + timeout))
while true; do
  # A throwaway query string and no-cache headers keep CDNs and browsers out of the way.
  live=$(curl -fsSL -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' "${url%/}/?verify=$RANDOM$RANDOM" || true)
  live_version=$(printf '%s' "$live" | sed -n 's/.*<meta name="version" content="\([^"]*\)".*/\1/p' | head -n1)
  if [ "$live_version" = "$version" ] && printf '%s' "$live" | grep -q "$script"; then
    echo "Live site serves version $version."
    exit 0
  fi
  echo "  live version: ${live_version:-<none>} (want $version)"
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "::error::$url still does not serve version $version after ${timeout}s. Rerun the Deploy Pages workflow from main (Actions > Deploy Pages > Run workflow); see documentation/web-shell.md."
    exit 1
  fi
  sleep "$interval"
done
