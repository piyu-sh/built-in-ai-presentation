#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found on PATH. Install Node.js 18+ first."
  exit 1
fi

echo "Starting portable deck..."
exec node ./tools/serve.mjs
