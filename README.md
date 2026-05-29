# ShadowTalk AI

**Think AI. Think ShadowTalk.**

ShadowTalk is the **agentic AI workspace** built for people who are tired of chatbots that only talk. Plan missions, run 30+ tools from one sentence, approve agent steps when it matters, and ship real work — on web, PWA, or desktop.

> *ChatGPT answers. ShadowTalk executes.*

---

## Why ShadowTalk sticks in your head

| Others | ShadowTalk |
|--------|------------|
| Single-thread chat | **Mission Control** — multi-step autonomous runs |
| Manual tool hopping | **30+ tools** from natural language |
| Cloud-only | **Vault, BYOK, optional on-device Gemma** |
| Browser tab | **Desktop app** with native files & notifications |

**1.5K+** creators · **104+** daily active users (and growing).

---

## Start in 60 seconds

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) → **Enter ShadowTalk** on the homepage.

### Desktop software

```bash
npm run build
npm run desktop:make
```

See [DESKTOP.md](./DESKTOP.md) for installers.

---

## Stack

- **Frontend:** React, Vite, Tailwind, shadcn/ui  
- **Backend:** Supabase (auth, DB, edge functions)  
- **AI:** Multi-model chat, agents, BYOK (Gemini / OpenRouter / Kimi)  
- **Desktop:** Capacitor + Electron  

---

## Environment

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Deploy migrations under `supabase/migrations` and configure edge function secrets (Stripe, AI keys, etc.) in your host — never commit secrets.

---

## Links

- **Live:** https://www.shadowtalk-ai.com  
- **Chat:** https://www.shadowtalk-ai.com/chatbot  
- **Download desktop:** https://www.shadowtalk-ai.com/download  

---

## License

MIT — build something legendary with it.

**Think AI. Think ShadowTalk.**
