# Mock Data & Hardcoded Configurations Report

This report documents all identified mock data, hardcoded content, and environment mocks within the ShadowTalk AI codebase.

## 1. Test Environment Mocks
These mocks are used to simulate browser APIs during testing.

| File Path | Purpose | Mocks Identified |
|-----------|---------|------------------|
| `src/test/setup.ts` | Vitest Setup | `matchMedia`, `ResizeObserver`, `IntersectionObserver`, `scrollTo`, `crypto.randomUUID`, `localStorage`, `sessionStorage` |

## 2. UI Content & Placeholder Data
Hardcoded data used to populate the user interface before real data is available or for static marketing sections.

| File Path | Purpose | Data Structures |
|-----------|---------|-----------------|
| `src/components/PricingSection.tsx` | Pricing Page | `plans` list, `Pay-Per-Solution` solutions, `Revenue Streams` (Credits, Affiliate, Tutorials), trust badges. |
| `src/components/FAQSection.tsx` | Landing Page FAQs | 8 static FAQ items across General, Features, Security, and Billing categories. |
| `src/pages/FAQPage.tsx` | Main FAQ Page | `FALLBACK_CATEGORIES` used when the database (Supabase) is empty or unreachable. |
| `src/components/FeaturesSection.tsx` | Features Overview | 6 bento-grid features, 4 platform stats, and 4 trust indicators. |
| `src/components/TestimonialsSection.tsx` | Transparency | Section explicitly states removal of fake testimonials; currently contains placeholder info about "building in public". |
| `src/components/CommunitySection.tsx` | Community Stats | `communityStats` (Members, Discussions, etc.), `events` (Workshop, Q&A, Challenge), and `benefits`. |
| `src/components/chat/ChatGPTBeaterIndicator.tsx` | Comparison | `COMPARISON_FEATURES` (9 features compared against ChatGPT). |
| `src/components/chat/AnalyticsDashboard.tsx` | Usage Analytics | Heuristic values for `avgResponseTime` (1.2s) and `productivityScore` (80%) when real data is thin. |

## 3. Template & Configuration Data
Static definitions for system behavior, templates, and specialized modes.

| File Path | Purpose | Data Structures |
|-----------|---------|-----------------|
| `src/components/chat/PersonalIDE.tsx` | IDE Templates | `PROJECT_TEMPLATES` (Blank, React, Dashboard, Landing, SaaS, E-Commerce, Portfolio, API), `LANG_MAP`, `FILE_ICONS`, `AI_ACTIONS`. |
| `src/components/chat/cowork/AutonomousAgent.tsx` | Cowork Agent | `PROJECT_TEMPLATES` (SaaS, E-Commerce, Dashboard, Blog, API) for the autonomous coding agent. |
| `src/components/chat/ShadowAgentPanel.tsx` | Agent Controls | `AGENT_SKILLS`, `EXAMPLE_TASKS`, `QUICK_TEMPLATES`, plus local `INDUSTRIES` and `REGIONS` list for compliance scanning. |
| `src/lib/industries.ts` | Industry Engine | `INDUSTRIES` (12 industry configs with personas, widgets, and mission templates). |
| `src/components/chat/ModelSwitcher.tsx` | AI Model List | `MODELS` (Comprehensive list of 13+ AI models across Lovable, OpenAI, Google, Anthropic, xAI, and Perplexity). |
| `src/lib/stripe.ts` | Subscription Detail | `PLAN_DETAILS` (Free, Pro, Premium, Elite, Lifetime) containing feature lists and marketing comparisons. |
| `src/components/chat/WordleGame.tsx` | Mini-game | `WORD_LIST` (Extensive dictionary of 5-letter words for offline play). |

## 4. System & Integration Logic
Hardcoded triggers and icons for behavioral logic.

| File Path | Purpose | Data Structures |
|-----------|---------|-----------------|
| `src/hooks/useProactiveAI.ts` | Behavioral AI | `TRIGGER_ICONS` for 30+ proactive triggers (Mood, Exit intent, Battery, etc.). |
| `src/lib/stripe.ts` | Payment Config | `STRIPE_CONFIG` with hardcoded Price IDs and Product IDs. |

---
**Report Generated:** 2025-02-14
**Status:** Comprehensive scan complete.