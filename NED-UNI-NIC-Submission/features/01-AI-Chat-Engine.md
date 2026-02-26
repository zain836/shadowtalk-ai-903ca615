# Feature Document: AI Chat Engine

## Overview

The AI Chat Engine is ShadowTalk's core intelligence layer — a multi-model conversational AI system that understands context, generates intelligent responses, and adapts to the user's industry and communication style.

## How It Works

1. User sends a message through the chat interface
2. The system identifies the user's selected **industry** (e.g., Finance, Legal)
3. An **industry-specific AI persona** is injected into the system prompt
4. The message is routed to Google Gemini 2.5 Pro (or Flash for speed)
5. The AI responds with contextually relevant, domain-expert-level answers
6. Conversations are stored (encrypted) for continuity across sessions

## Key Capabilities

| Capability | Description |
|-----------|-------------|
| **Multi-Model Support** | Gemini 2.5 Pro, Gemini 2.5 Flash, local WebGPU models |
| **Industry Adaptation** | 12 industry-specific AI personas (Finance, Legal, Healthcare, etc.) |
| **Context Window** | Full conversation history maintained across sessions |
| **Code Generation** | Inline code blocks with syntax highlighting |
| **Markdown Rendering** | Rich formatting, tables, math (KaTeX), diagrams |
| **Export Options** | Download conversations as text, PDF, or markdown |
| **Multi-Language** | 10+ language support with real-time translation |

## Technical Implementation

- **Backend:** Supabase Edge Function (`chat/index.ts`)
- **AI Provider:** Google Gemini API via Lovable AI proxy
- **Database:** `conversations` and `messages` tables with RLS
- **Frontend:** React with streaming response rendering
- **Industry Prompt Injection:** Dynamic system prompts from `industries.ts`

## User Experience

- **Free Users:** 50 messages per day
- **Pro Users:** Unlimited messages
- **Offline Mode:** WebGPU-powered local inference when disconnected

## Competitive Advantage

| Metric | ChatGPT | ShadowTalk AI |
|--------|---------|---------------|
| Free messages/day | ~10 (GPT-4) | 50 |
| Industry adaptation | ❌ Generic | ✅ 12 sectors |
| Offline capability | ❌ | ✅ WebGPU |
| Data privacy | Cloud-stored | Zero-knowledge |
| Cost (unlimited) | $20/mo | $5/mo |
