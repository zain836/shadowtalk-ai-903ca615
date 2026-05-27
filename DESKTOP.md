# ShadowTalk Desktop

ShadowTalk ships as installable desktop software via **Capacitor + Electron** (`electron/`).

## What the desktop app adds

- **Native file picker** — open documents from anywhere on disk in chat
- **Native save dialog** — export conversations to `.md`, `.txt`, or `.json`
- **System notifications** — agent and task alerts in the OS tray
- **System tray** — keep ShadowTalk running in the background
- **Launch at login** — optional auto-start (Profile → Preferences → Desktop app)
- **Dedicated app data folder** — offline models, vault exports, and caches under Electron `userData`
- **Larger default window** — 1280×860 workspace layout

## Build installers

```bash
npm install
npm run build
npm run desktop:make
```

Installers are written to `electron/dist/` (Windows `.exe`, macOS `.dmg`, Linux AppImage when enabled).

## Run in development

```bash
npm run desktop:start
```

## Publish to users

1. Run `npm run desktop:make` on each target OS (or use CI).
2. Upload artifacts to **GitHub Releases**.
3. Link download URLs on https://www.shadowtalk-ai.com/download (`/download` page).

## Configuration

- Root `capacitor.config.ts` — app id `com.shadowtalk.ai`, Electron tray/splash
- `electron/electron-builder.config.json` — installer branding and targets
- Native bridge: `window.shadowtalkDesktop` (see `src/lib/desktopBridge.ts`)
