# Recommended Fixes & Prioritized Roadmap

This file lists all recommended changes, grouped by area, with brief implementation notes and priorities so you can remediate risks and ship faster.

1) Critical (do these immediately)
- Remove secrets and rotate keys:
  - Remove the checked-in `.env` file from the repository and rotate any exposed Supabase keys immediately.
  - Add `.env` to `.gitignore` and add a `.env.example` documenting required variables.
  - If secrets were committed historically, plan a key rotation and optionally rewrite git history (use `git filter-repo` carefully).

- Lock down Supabase function auth:
  - In `supabase/config.toml`, set `verify_jwt = true` for functions that require authenticated access.
  - Ensure service-role keys are only used server-side and never exposed to clients.

- Enforce Row-Level Security (RLS) and least privilege:
  - Review Supabase migrations and policies; enable RLS where appropriate and verify policies for `public` tables.

2) Security & Compliance
- Secrets management:
  - Integrate a secrets manager for CI and production (GitHub Secrets, Vault, Azure Key Vault).

- Audit logging & provenance:
  - Add structured logging for server functions and an append-only audit for admin actions and payments.

- Privacy & compliance:
  - Add `SECURITY.md` and plan for SOC2 / HIPAA controls if pursuing regulated verticals.

3) Build / CI / Quality
- Add CI pipeline (`.github/workflows/ci.yml`):
  - Steps: `npm ci`, `npm run lint`, `npm run build`, `npm run test` (if tests exist).

- Add tests and baseline coverage:
  - Add Vitest + React Testing Library unit tests for critical flows (auth, chat API calls).

- Linting & formatting:
  - Ensure ESLint + Prettier are configured and run in CI. Add `eslint` script if missing.

4) Code & Dependency Hygiene
- Update dependencies & pin versions:
  - Review `package.json` devDependencies and dependencies. Run `npm audit` and patch high/critical issues.

- TypeScript and types:
  - Fix any implicit `any`s; ensure `tsconfig.json` strictness is tuned for early detection.

- Remove or secure any hardcoded tokens in code (search for `Bearer` fallbacks to publishable keys).

5) Supabase / Backend
- Functions hardening:
  - Review `supabase/functions/*` for input validation, rate limiting, and error handling.

- Migrations and schema:
  - Verify migrations in `supabase/migrations/` reflect production intent; add tests for critical migrations.

- Secrets usage inside functions:
  - Move any service keys to environment variables in the deployment environment only.

6) Docs / Onboarding
- Improve `README.md`:
  - Replace placeholders `REPLACE_WITH_PROJECT_ID` and add a `Setup` section with `node` version, `npm install`, `npm run dev`, `.env` variables, and Supabase setup steps.

- Add `CONTRIBUTING.md`, `SECURITY.md`, and `LICENSE` (if applicable).

7) Product & Architecture (short-term)
- Prioritize features for MVP:
  - Implement `features.md` top 3: Universal Personal Agent core integrations, Enterprise Data Connectors + Secure Memory, Payments & Microtransaction Engine.

- Move long-running jobs off client:
  - Any heavy processing (e.g., model orchestration, long-running Gemini calls) should run server-side with proper queuing and retries.

8) Observability & Operations
- Add monitoring and error-tracking:
  - Integrate Sentry or equivalent for server functions and client errors.

- Add metrics and alerting:
  - Track request rates, error rates, latency, cost metrics for Gemini API usage.

9) UX, Accessibility & Performance
- Accessibility:
  - Run an a11y audit (axe) and fix issues in critical pages (chat, auth, admin).

- Performance & bundle size:
  - Add code-splitting for large pages, tree-shake unused libs, and optimize images/assets.

10) Security hardening (additional)
- Rate limiting & abuse detection:
  - Add server-side rate limits for public endpoints and anti-abuse rules for paid features.

- Content moderation & fraud prevention:
  - Add real-time moderation classifiers for user-generated content and commerce flows.

11) Dev ergonomics
- Developer setup docs:
  - Spell out `node` version and how to run local Supabase emulation (if used).

- Add a `Makefile` or `package.json` shortcuts for common tasks (`setup`, `start`, `build`, `test`).

12) Optional but high ROI
- CI deploy preview + staging environment.
- Dockerfile for reproducible builds and local staging.

Prioritized implementation plan (first 30 days)
1. Critical security fixes: remove `.env`, rotate keys, update `.gitignore`, enable `verify_jwt` where needed (3–7 days).
2. Add `.env.example`, update `README.md`, and add basic developer setup docs (1–2 days).
3. Add CI pipeline that runs lint + build + tests (2–4 days).
4. Add Sentry and basic telemetry for functions (1–2 days).
5. Implement one paid flow (Stripe test integration) to prove monetization (5–10 days).

Notes on automation and help
- I can implement the low-risk, high-value changes now: create `.env.example`, add `.gitignore` entry for `.env` (if you want), and scaffold a GitHub Actions `ci.yml`. Tell me which to do and I will apply the changes.

File created: 2026-01-05
