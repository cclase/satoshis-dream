#!/bin/bash
set -euo pipefail

# Only run in remote (web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install npm package (sets up test script from package.json)
npm install

echo "[policy] If models/ changes, update CREDITS.md in the same commit."
