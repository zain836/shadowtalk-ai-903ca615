# ShadowTalk Foundation Release

Unified release merging PRs **#12–#15** plus agentic loop hardening.

## What ships

| Area | Contents |
|------|----------|
| Trust (#12) | `productClaims.ts`, honest limits, real community metrics, no fake JSON-LD ratings |
| Desktop (#13) | Electron app, `/download`, native file picker, `desktopBridge` |
| Brand (#14) | Think AI. Think ShadowTalk., manifesto, SEO |
| Agentic (#15) | Tool dispatch, SSE streaming, default Agentic mode, ⌘K palette |
| Loop | HITL confirm on tools, `consumeChatSSE` in Task Runner, ReAct web-search routing, client metrics |

## Deploy checklist

### 1. Merge & build frontend

```bash
git checkout cursor/release-foundation-7adb
npm ci
npm run build
```

Deploy `dist/` to your host (Vercel, Cloudflare, etc.).

### 2. Supabase edge functions

```bash
supabase functions deploy chat
supabase functions deploy shadow-agent-tools
supabase functions deploy mission-execute
supabase functions deploy web-search
supabase functions deploy notify-app-update
```

Ensure secrets: `LOVABLE_API_KEY`, `GOOGLE_SEARCH_API_KEY`, `GOOGLE_SEARCH_ENGINE_ID`.

### 3. Database migrations

```bash
supabase db push
```

Includes update notifications (`20260526150000_update_notification_system.sql`).

### 4. Desktop (optional)

```bash
npm run desktop:make
```

See `DESKTOP.md`.

### 5. Production smoke test (`/chat`)

- [ ] E2EE vault unlock
- [ ] Guest limits enforced
- [ ] `calculate 2+2` → calculator card
- [ ] Web search confirm → **Run** → cited results
- [ ] ⌘K → Agentic runner, Mission Control, browser
- [ ] Deep research (paid tier if gated)
- [ ] Export chat (ShareDialog / desktop save)
- [ ] `/download` page loads

### 6. Metrics (honest “#1” tracking)

Client stores events in `localStorage` key `shadowtalk_agentic_metrics_v1`.

In browser console:

```js
import { getAgenticMetricsSummary } from './src/lib/agenticMetrics';
// Or expose via admin debug panel later
```

Track: tool run rate, mission completion %, stream completes, retention (DAU/MAU in your analytics).

## Branch strategy

- **Merge to `main`:** `cursor/release-foundation-7adb` (single PR recommended)
- Close or rebase overlapping drafts: #5 vs #15 (keep #15 router), old #1/#2 after review

## Post-release priorities

1. Wire metrics to Supabase/PostHog
2. Offline (#8) + BYOK (#10) after online agentic is stable
3. Notifications (#11) when missions complete reliably
