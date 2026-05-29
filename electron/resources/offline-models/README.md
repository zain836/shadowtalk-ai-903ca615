# Tier C — bundled offline model (optional)

Place the MLC model folder here before building the desktop installer:

```
offline-models/
  SmolLM2-135M-Instruct-q4f16_1-MLC/
    (MLC model files from Hugging Face mlc-ai/SmolLM2-135M-Instruct-q4f16_1-MLC)
```

Run from repo root (requires network once):

```bash
bash scripts/download-tier-a-model.sh
```

Without this folder, the desktop app still works: Tier A downloads on first launch like the web app (~130 MB).
