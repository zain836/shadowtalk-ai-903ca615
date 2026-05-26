# ShadowTalk AI

**ShadowTalk** is a privacy-first, multimodal AI workspace: chat, voice, documents, presentations, code tools, and agent workflows in one app—with optional **offline AI**, **bring-your-own API keys** (BYOK), and encrypted conversations.

- **Website:** [shadowtalk-ai.com](https://www.shadowtalk-ai.com)
- **Repository:** [github.com/zain836/shadowtalk-ai-903ca615](https://github.com/zain836/shadowtalk-ai-903ca615)

---

## What is ShadowTalk?

ShadowTalk is built for people who want a capable AI assistant without giving up control of their data or their model provider.

| Capability | Description |
|------------|-------------|
| **Neural chat** | Streaming chat with personalities, modes (general, research, code, document, and more), and tool orchestration |
| **Bring your own key (BYOK)** | Use your own **Google Gemini**, **OpenRouter**, or **Kimi (Moonshot)** API key; keys stay in the browser and are sent only with requests |
| **Offline mode** | When the network is down, chat can fall back to on-device models (e.g. Gemma via WebGPU) where supported |
| **Documents & decks** | Kimi-style long-form documents and presentation generation |
| **Multimodal** | Images, files, voice, deep research, browser tools, and mission-style agents |
| **Security** | Optional end-to-end encryption (E2EE) for conversations, guest limits, and Supabase-backed auth |

ShadowTalk is **not** a single-model wrapper: the UI routes work to Supabase edge functions, which call the platform gateway or **your** provider when BYOK is configured.

---

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, PWA
- **Backend:** Supabase (Auth, Postgres, Edge Functions)
- **AI:** Lovable AI gateway (default) or user keys via OpenAI-compatible APIs (Gemini, OpenRouter, Moonshot)

---

## Quick start (local)

**Requirements:** Node.js 18+ and npm

```bash
git clone https://github.com/zain836/shadowtalk-ai-903ca615.git
cd shadowtalk-ai-903ca615
npm install
```

Create a `.env` (or `.env.local`) with:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Quality checks before deploy

```bash
npm run lint    # 0 errors expected
npm run build   # production bundle
npm run test    # unit tests (Vitest)
```

---

## Using your own Gemini (or other) API key

1. Open the **Chatbot** page.
2. Click **Add API key** (or complete the first-run dialog).
3. Choose **Google Gemini**, paste an [AI Studio](https://aistudio.google.com/apikey) key (`AIza…`), then **Test & save**.

Cloud chat, document revision, and presentation generation will use your key until you switch back to **ShadowTalk platform default**.

> **Note:** Free-tier keys work well for **text chat**. Image generation and some advanced models may hit provider limits or unsupported features.

---

## Supabase & edge functions

Apply migrations under `supabase/migrations`, then deploy functions including:

| Function | Purpose |
|----------|---------|
| `chat` | Main streaming chat and tools |
| `document-ai` | Document rewrite / revise |
| `generate-presentation` | Slide deck generation |
| `test-custom-ai-key` | Validates BYOK before save |

Set `LOVABLE_API_KEY` (and other secrets) in the Supabase dashboard. BYOK requests still hit your edge functions; the user’s key is forwarded to the chosen provider, not stored server-side.

---

## Active development branches

| Branch | Focus |
|--------|--------|
| `main` | Stable baseline |
| `cursor/custom-api-keys-7adb` | BYOK (Gemini, OpenRouter, Kimi) |
| `cursor/offline-mode-7adb` | Offline / hybrid chat routing |
| `cursor/remove-popups-tutorials-7adb` | Cleaner UX (no boot/onboarding popups) |

Open pull requests on GitHub for the latest merge status.

---

## Contributing

1. Branch from `main` (use the `cursor/<feature>-7adb` naming convention for agent work).
2. Run `npm run lint` and `npm run build`.
3. Open a PR with a clear summary and deploy notes for any new edge functions.

---

## License

Private project. See repository owner for terms of use and distribution.
