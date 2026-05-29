# ShadowTalk AI

**Think AI. Think ShadowTalk.**

**The AI workspace that doesn't own you.**

ShadowTalk is the **agentic AI workspace** for people who are tired of chatbots that only talk. Plan missions, run 30+ tools from one sentence, approve agent steps when it matters, and ship real work — on **web, PWA, or desktop** — while **you** stay in control of your keys, data, and pace.

> *ChatGPT answers. ShadowTalk executes.*

**[Launch ShadowTalk →](https://www.shadowtalk-ai.com)** · **[Open chat](https://www.shadowtalk-ai.com/chatbot)** · [Repository](https://github.com/zain836/shadowtalk-ai-903ca615)

---

## Why people switch

You've tried the big names. You've hit the paywalls, the rate limits, the "we updated our policy" emails. ShadowTalk is built for one thing: **make you dangerously productive without selling you out.**

| Others | ShadowTalk |
|--------|------------|
| Single-thread chat | **Mission Control** — multi-step autonomous runs |
| Manual tool hopping | **30+ tools** from natural language |
| Cloud-only | **Vault, BYOK, optional on-device Gemma** |
| Browser tab | **Desktop app** with native files & notifications |
| Platform credits only | **Your API keys, your bill** — Gemini, OpenRouter, Kimi |

| You get | What that means for you |
|--------|-------------------------|
| **One workspace, not ten tabs** | Chat, research, code, images, long-form docs, presentations, and mission-style agents—no tab circus. |
| **Works when the internet doesn't** | Offline routing to on-device models where supported—you're not hostage to an outage banner. |
| **Privacy that isn't marketing fluff** | Guest access, BYOK, and architecture that keeps keys **yours**. |
| **Updates that find you** | Ship a release in admin—every user gets notified. |

> **Stop renting intelligence.** Own how you work, what you pay, and who sees your prompts.

**1.5K+** creators · **104+** daily active users (and growing).

---

## What ShadowTalk actually is

ShadowTalk is a **privacy-first, multimodal AI operating layer**—not a thin ChatGPT skin.

- **Neural chat** with personalities, pro modes, and tool orchestration that feels like a team, not a toy.
- **Bring-your-own-key (BYOK)** so power users aren't trapped in platform credits.
- **Document & presentation studio** for client-ready output in minutes, not hours.
- **Deep research, browser tools, and agent workflows** for people who execute—not just prompt.
- **Admin control panel** for releases, broadcasts, users, and platform ops—built in, not bolted on.

Under the hood: **React + Supabase edge functions**, routing to the platform gateway or **your** provider when BYOK is on. This repo is the real product—not a demo template.

---

## Built for people who refuse to fall behind

If you're still copying prompts between five apps, you're already behind. ShadowTalk compresses the stack:

1. **Sign in** (or try as guest).
2. **Add your API key** if you want usage on your terms.
3. **Work in one place**—chat, create, research, present.
4. **Go offline** when you need to.
5. **Get pinged** when we ship—so you're never the last to know.

**[Open the app](https://www.shadowtalk-ai.com/chatbot)** — the workspace is live. The question isn't whether you need an AI OS. It's whether you'll keep funding someone else's roadmap.

---

## Start in 60 seconds

```bash
git clone https://github.com/zain836/shadowtalk-ai-903ca615.git
cd shadowtalk-ai-903ca615
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) → **Enter ShadowTalk** on the homepage.

### Desktop software

```bash
npm run build
npm run desktop:make
```

See [DESKTOP.md](./DESKTOP.md) for installers. Download builds: https://www.shadowtalk-ai.com/download

---

## Stack

- **Frontend:** React, Vite, Tailwind, shadcn/ui
- **Backend:** Supabase (auth, DB, edge functions)
- **AI:** Multi-model chat, agents, BYOK (Gemini / OpenRouter / Kimi)
- **Desktop:** Capacitor + Electron

---

## For developers & operators

`.env` / `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

```bash
npm run build
npm test
```

| Area | Path |
|------|------|
| Admin panel | `/admin` (requires `admin` in `user_roles`) |
| Edge functions | `supabase/functions/` |
| Migrations | `supabase/migrations/` |
| BYOK routing | `supabase/functions/_shared/custom-ai-provider.ts` |
| Update notifications | `notify-app-update`, `app_updates` table |

**Deploy:** run migrations, deploy `chat`, `notify-app-update`, `assign-admin-role`, and related functions; set `LOVABLE_API_KEY` and integration secrets in Supabase — never commit secrets.

---

## Active branches

| Branch | Focus |
|--------|--------|
| `main` | Production baseline |
| `cursor/desktop-app-7adb` | Desktop (Capacitor + Electron) |
| `cursor/custom-api-keys-7adb` | BYOK (Gemini / OpenRouter / Kimi) |
| `cursor/update-notifications-7adb` | Auto update alerts + unified admin panel |

Open [Pull Requests](https://github.com/zain836/shadowtalk-ai-903ca615/pulls) for merge status.

---

## Links

- **Live:** https://www.shadowtalk-ai.com
- **Chat:** https://www.shadowtalk-ai.com/chatbot
- **Download desktop:** https://www.shadowtalk-ai.com/download

---

## The bottom line

Legacy AI tools were built to **capture** you. ShadowTalk was built so you can **command**—your models, your privacy, your pace—on web or desktop.

**[shadowtalk-ai.com](https://www.shadowtalk-ai.com)** — use it before your workflow becomes someone else's product roadmap.

---

*ShadowTalk AI · Private repo. Contact the maintainer for licensing and distribution.*

**Think AI. Think ShadowTalk.**
