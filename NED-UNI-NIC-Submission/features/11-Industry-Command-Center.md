# Feature Document: Industry Command Center

## Overview

The Industry Command Center is ShadowTalk's **adaptive industry intelligence system** that transforms the entire platform to serve 12 specific sectors. When a user selects their industry, the AI persona, dashboard widgets, quick actions, and mission templates all adapt automatically.

## Supported Industries (12)

| # | Industry | AI Persona Focus |
|---|----------|-----------------|
| 1 | Finance & Trading | Market analysis, risk/reward, SEC/FINRA compliance |
| 2 | Legal & Compliance | Contract analysis, case law, regulatory compliance |
| 3 | Healthcare & Medical | Evidence-based medicine, HIPAA, clinical research |
| 4 | Real Estate | CMA, cap rates, investment modeling, zoning |
| 5 | Technology & SaaS | System design, SaaS metrics, tech stacks |
| 6 | E-Commerce & Retail | Conversion optimization, CLV, inventory management |
| 7 | Food & Hospitality | Menu engineering, food cost, health codes |
| 8 | Education & Training | Curriculum design, learning analytics, EdTech |
| 9 | Logistics & Supply Chain | Route optimization, inventory, demand forecasting |
| 10 | Creative & Media | Brand strategy, content calendars, campaigns |
| 11 | Energy & Sustainability | Renewable analysis, carbon tracking, ESG |
| 12 | Travel & Aviation | Revenue management, route analysis, hospitality |

## How It Works

1. User selects their industry from the Command Center
2. Selection is persisted in `localStorage` via `useIndustry` hook
3. Every AI request includes the `industry` parameter
4. The chat Edge Function injects the industry-specific system prompt
5. All responses are filtered through domain expertise

## Architecture

```
User selects "Finance" → localStorage stores "finance"
    ↓
ChatbotPage reads industry → includes in API request
    ↓
Edge Function injects: "You are a senior financial analyst..."
    ↓
AI responds with financial expertise, ticker symbols, risk analysis
```

## Competitive Advantage

**No competitor offers industry-adaptive AI personas.** ChatGPT, Claude, and Perplexity provide generic responses regardless of the user's professional domain. ShadowTalk's Command Center makes every interaction industry-native.
