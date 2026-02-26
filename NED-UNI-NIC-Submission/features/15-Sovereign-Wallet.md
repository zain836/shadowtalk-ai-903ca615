# Feature Document: Sovereign Wallet & Credits System

## Overview

The Sovereign Wallet is ShadowTalk's **payment and credit management system** that enables flexible monetization through Shadow Credits, subscriptions, and pay-per-solution transactions.

## Credit System

| Package | Credits | Price |
|---------|---------|-------|
| Starter | 12 | $10 |
| Pro Pack | 30 | $22 |
| Power Pack | 100 | $60 |

### Credit Costs by Feature

| Feature | Credits |
|---------|---------|
| Chat Session | 1 |
| Deep Research | 3 |
| Strategy Report | 5 |
| Presentation | 5 |
| Image Generation | 1 |

## Revenue Streams

1. **Subscriptions** — Monthly recurring (Pro $5, Premium $15, Elite $20)
2. **Lifetime Deal** — $99 one-time payment for Elite access
3. **Shadow Credits** — Consumable credits for premium features
4. **Pay-Per-Solution** — One-time document generation ($5–$200)
5. **Affiliate Program** — 20-40% recurring commission for referrals
6. **Enterprise Licensing** — Custom pricing for organizations

## Database Schema

```sql
shadow_credits (id, user_id, balance, total_purchased, total_consumed, ...)
credit_transactions (id, user_id, amount, transaction_type, session_type, description, ...)
```
