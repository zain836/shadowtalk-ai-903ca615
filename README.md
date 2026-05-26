# ShadowTalk AI

**The AI workspace that doesn’t own you.**

Everyone else wants your data, your keys, and your attention. ShadowTalk gives you a full neural command center—chat, voice, documents, decks, agents, and offline intelligence—while **you** stay in control.

**[Launch ShadowTalk →](https://www.shadowtalk-ai.com)** · [Repository](https://github.com/zain836/shadowtalk-ai-903ca615)

---

## Why people switch

You’ve tried the big names. You’ve hit the paywalls, the rate limits, the “we updated our policy” emails. ShadowTalk is built for one thing: **make you dangerously productive without selling you out.**

| You get | What that means for you |
|--------|-------------------------|
| **One workspace, not ten tabs** | Chat, research, code, images, long-form docs, presentations, and mission-style agents—no tab circus. |
| **Your API keys, your bill** | Plug in **Gemini**, **OpenRouter**, or **Kimi** and run ShadowTalk on *your* quota. Keys never live on our servers. |
| **Works when the internet doesn’t** | Offline routing to on-device models where supported—you’re not hostage to a outage banner. |
| **Privacy that isn’t marketing fluff** | Optional encrypted conversations, guest access, and a stack designed so BYOK stays **yours**. |
| **Updates that find you** | Ship a release in admin—every user gets notified. You’re not guessing what changed. |

> **Stop renting intelligence.** Own how you work, what you pay, and who sees your prompts.

---

## What ShadowTalk actually is

ShadowTalk is a **privacy-first, multimodal AI operating layer**—not a thin ChatGPT skin.

- **Neural chat** with personalities, pro modes, and tool orchestration that feels like a team, not a toy.
- **Bring-your-own-key (BYOK)** so power users and builders aren’t trapped in platform credits.
- **Document & presentation studio** for client-ready output in minutes, not hours.
- **Deep research, browser tools, and agent workflows** for people who execute—not just prompt.
- **Admin control panel** for releases, broadcasts, users, and platform ops—built in, not bolted on.

Under the hood: **React + Supabase edge functions**, routing to the platform gateway or **your** provider when BYOK is on. This repo is the real product—not a demo template.

---

## Built for people who refuse to fall behind

If you’re still copying prompts between five apps, you’re already behind. ShadowTalk compresses the stack:

1. **Sign in** (or try as guest).
2. **Add your API key** if you want unlimited-style usage on your terms.
3. **Work in one place**—chat, create, research, present.
4. **Go offline** when you need to.
5. **Get pinged** when we ship—so you’re never the last to know.

**[Open the app](https://www.shadowtalk-ai.com/chatbot)** — the workspace is live. The question isn’t whether you need an AI OS. It’s whether you’ll keep funding someone else’s.

---

## For developers & operators

```bash
git clone https://github.com/zain836/shadowtalk-ai-903ca615.git
cd shadowtalk-ai-903ca615
npm install
```

`.env` / `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

```bash
npm run dev
npm run build
```

| Area | Path |
|------|------|
| Admin panel | `/admin` (requires `admin` in `user_roles`) |
| Edge functions | `supabase/functions/` |
| Migrations | `supabase/migrations/` |
| BYOK routing | `supabase/functions/_shared/custom-ai-provider.ts` |
| Update notifications | `notify-app-update`, `app_updates` table |

**Deploy:** run migrations, deploy `chat`, `notify-app-update`, `assign-admin-role`, and related functions; set `LOVABLE_API_KEY` and integration secrets in Supabase.

---

## Active branches

| Branch | Focus |
|--------|--------|
| `main` | Production baseline |
| `cursor/custom-api-keys-7adb` | BYOK (Gemini / OpenRouter / Kimi) |
| `cursor/update-notifications-7adb` | Auto update alerts + unified admin panel |

Open [Pull Requests](https://github.com/zain836/shadowtalk-ai-903ca615/pulls) for merge status.

---

## The bottom line

Legacy AI tools were built to **capture** you. ShadowTalk was built so you can **command**—your models, your privacy, your pace.

**[shadowtalk-ai.com](https://www.shadowtalk-ai.com)** — use it before your workflow becomes someone else’s product roadmap.

---

*ShadowTalk AI · Private repo. Contact the maintainer for licensing and distribution.*
