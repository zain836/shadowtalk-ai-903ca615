#!/usr/bin/env bash
# Downloads Tier A SmolLM MLC weights into electron/resources for desktop bundling.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/electron/resources/offline-models/SmolLM2-135M-Instruct-q4f16_1-MLC"
mkdir -p "$DEST"
echo "Download MLC SmolLM2-135M into $DEST"
echo "Use: huggingface-cli download mlc-ai/SmolLM2-135M-Instruct-q4f16_1-MLC --local-dir \"$DEST\""
echo "Or copy from an existing WebLLM browser cache after loading the model once in dev."
