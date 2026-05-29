# ShadowTalk Offline AI (Tiers A + B + C)

## Tiers

| Tier | Model | Size | Who gets it |
|------|--------|------|-------------|
| **A** | SmolLM2 135M (WebLLM) | ~130 MB | All users — opt-in install banner; auto-runs after consent |
| **B** | Gemma 3n E2B/E4B (Transformers) | ~1.7–3.2 GB | Power users — Profile → Offline AI |
| **C** | Same as A, bundled | ~130 MB in installer | Desktop `.dmg` / `.exe` when `electron/resources/offline-models` is populated |

## How routing works

1. `decideRoute()` in `hybridRouter.ts` picks **local** vs **cloud**.
2. `runLocalChat()` uses **Gemma if loaded**, else **SmolLM**.
3. `ChatbotPage` calls local inference when route is `local`; otherwise cloud SSE.

## User flows

- First visit: **OfflineBootstrapBanner** → Install now (~130 MB).
- Offline network: chat uses on-device model if installed; otherwise helpful error.
- Profile: **Offline AI** for Gemma download and routing (auto / local-only / cloud-only).

## Desktop build with pre-install (Tier C)

```bash
bash scripts/download-tier-a-model.sh   # once, populate resources
npm run desktop:make
```

Electron reports `offlineModelBundled` via `getInfo()` so the app can load without a second download when the cache is seeded.

## CSP

Production Electron CSP allows Hugging Face and Supabase so Tier A/B downloads work.

## Licenses

Bundling models in an installer may require compliance with each model’s license (SmolLM, Gemma, Llama, etc.). Ship attribution in-app.
