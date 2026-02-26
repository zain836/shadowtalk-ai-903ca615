# Product Overview — ShadowTalk AI

## What is ShadowTalk AI?

ShadowTalk AI is an **On-Device AI Operating System** that provides sovereign intelligence for creators, coders, and CEOs. Unlike traditional cloud-based AI assistants, ShadowTalk runs AI inference directly on the user's device using WebGPU technology, ensuring:

- **Zero data harvesting** — conversations never leave the device
- **Full offline capability** — works without internet connection
- **Enterprise-grade security** — E2E encryption, zero-knowledge architecture
- **75% cost reduction** — compared to ChatGPT Pro ($200/mo vs $20/mo)

## Platform Architecture

```
┌─────────────────────────────────────────────────┐
│                  USER DEVICE                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ WebGPU   │  │ Stealth  │  │ Knowledge│      │
│  │ Inference│  │  Vault   │  │  Graph   │      │
│  │ Engine   │  │ (E2E)    │  │ (Local)  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│           ↕ (when online)                        │
│  ┌──────────────────────────────────────┐       │
│  │    Connectivity Transition Layer      │       │
│  └──────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
              ↕ (encrypted, optional)
┌─────────────────────────────────────────────────┐
│              EDGE FUNCTIONS                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Gemini   │  │ Deep     │  │ Strategy │      │
│  │ AI Chat  │  │ Research │  │  Agent   │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Image    │  │ Mission  │  │ Industry │      │
│  │ Gen      │  │ Control  │  │ Command  │      │
│  └──────────┘  └──────────┘  └──────────┘      │
└─────────────────────────────────────────────────┘
```

## Core Features (15+)

### Tier 1 — Intelligence Layer
| Feature | Description | Status |
|---------|-------------|--------|
| AI Chat Engine | Multi-model conversational AI (Gemini 2.5 Pro, Flash) | ✅ Live |
| Deep Research | Multi-source research with citations and analysis | ✅ Live |
| Code Generator | Generate, debug, optimize code in any language | ✅ Live |
| Image Generation | AI-powered image creation (4 free/day) | ✅ Live |
| Creative Synthesis | Content transformation engine (4 modes, 16 formats) | ✅ Live |

### Tier 2 — Sovereignty Layer
| Feature | Description | Status |
|---------|-------------|--------|
| Offline Mode | Full AI via WebGPU — no internet required | ✅ Live |
| Stealth Vault | E2E encrypted note/document storage | ✅ Live |
| Knowledge Graph | Personal knowledge management with connections | ✅ Live |
| Privacy Dashboard | Real-time transparency and data flow visualization | ✅ Live |

### Tier 3 — Automation Layer
| Feature | Description | Status |
|---------|-------------|--------|
| Strategy Agent | Autonomous business intelligence agent | ✅ Live |
| Mission Control | Multi-step workflow executor (S.E.E. Framework) | ✅ Live |
| Smart Scripts | AI-powered task automation scripts | ✅ Live |
| Industry Command Center | 12-sector adaptive AI with custom personas | ✅ Live |

### Tier 4 — Business Layer
| Feature | Description | Status |
|---------|-------------|--------|
| Presentation Builder | McKinsey-tier slide deck generator | ✅ Live |
| Sovereign Wallet | Credits, payments, and monetization engine | ✅ Live |
| Marketplace | Agent/skill marketplace for third-party integrations | ✅ Live |

## Pricing Model

| Plan | Price | Key Features |
|------|-------|-------------|
| **Free** | $0/mo | 50 msgs/day, 4 images, 5 deep research |
| **Pro** | $5/mo | Unlimited msgs, 20 images, 20 research |
| **Premium** | $15/mo | 50 images, 50 research, PCE, workflows |
| **Elite** | $20/mo | Unlimited everything, offline, Stealth Vault |
| **Lifetime** | $99 | Elite forever (limited to 100 seats) |
| **Pay-Per-Solution** | $5–$200 | One-time documents, reviews, reports |

## Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Supabase (PostgreSQL, Edge Functions, Auth, Storage)
- **AI Models:** Google Gemini 2.5 Pro/Flash, WebGPU local inference
- **Security:** AES-256 encryption, bcrypt, zero-knowledge architecture
- **PWA:** Service workers, offline storage, push notifications
- **Deployment:** Lovable Cloud, CDN-distributed

## Target Users

1. **Freelancers & Creators** — content generation, client work, privacy
2. **Software Engineers** — code generation, debugging, documentation
3. **Startup Founders** — business plans, strategy, market research
4. **Enterprise Teams** — compliance, legal analysis, secure communications
5. **Students & Researchers** — academic research, writing, analysis
6. **Professionals across 12 industries** — Finance, Legal, Healthcare, etc.
