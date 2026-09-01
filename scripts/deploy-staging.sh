#!/usr/bin/env bash
# Build a static preview of public storefront pages and publish a free
# Vercel temporary HTTPS URL (no custom domain, no live DNS).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$ROOT/scripts/build-static-preview.py"
npx --yes vercel@latest deploy --temporary --yes /tmp/medstead-stage/out
