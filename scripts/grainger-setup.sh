#!/bin/bash
# Grainger import setup helper.
#
# Run once on the server before the first import:
#   bash scripts/grainger-setup.sh
#
# Then either:
#  - upload via /admin/products/import (preferred) or
#  - run manually:
#       nice -n 19 ionice -c 3 npx ts-node --compiler-options '{"module":"CommonJS"}' \
#         scripts/grainger-import.ts --file=/path/to/Grainger.xlsx --job=<jobId>

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HQ_SOURCE="/var/www/static-uploads/grainger-hq"
LINK_TARGET="$PROJECT_ROOT/public/uploads/grainger-hq"

echo "Project root: $PROJECT_ROOT"

if [ ! -d "$HQ_SOURCE" ]; then
  echo "ERROR: $HQ_SOURCE does not exist."
  echo "Please ensure HQ images are downloaded first."
  exit 1
fi

mkdir -p "$PROJECT_ROOT/public/uploads"

if [ -e "$LINK_TARGET" ]; then
  if [ -L "$LINK_TARGET" ]; then
    echo "Symlink already exists: $LINK_TARGET -> $(readlink "$LINK_TARGET")"
  else
    echo "ERROR: $LINK_TARGET exists and is not a symlink."
    exit 1
  fi
else
  ln -s "$HQ_SOURCE" "$LINK_TARGET"
  echo "Created symlink: $LINK_TARGET -> $HQ_SOURCE"
fi

mkdir -p /tmp/grainger-imports
chmod 755 /tmp/grainger-imports

IMG_COUNT=$(find "$HQ_SOURCE" -maxdepth 1 -type f -name '*.jpg' 2>/dev/null | wc -l)
echo "Image files available: $IMG_COUNT"

echo ""
echo "Setup complete. You can now use /admin/products/import (Grainger tab)."
echo ""
echo "To inspect a running job:"
echo "  tail -f /tmp/grainger-import-<jobId>.log"
