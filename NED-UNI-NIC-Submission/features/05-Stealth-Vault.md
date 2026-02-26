# Feature Document: Stealth Vault

## Overview

The Stealth Vault is ShadowTalk's **end-to-end encrypted** note and document storage system. Users can store sensitive information (passwords, legal notes, financial data, medical records) with military-grade encryption — data is encrypted on-device before being stored.

## How It Works

1. User creates a vault entry with a title and content
2. Content is encrypted on-device using **AES-256-GCM** encryption
3. A unique **salt** and **initialization vector (IV)** are generated per entry
4. Only the encrypted blob is stored in the database
5. Decryption happens exclusively on the user's device using their master key

```
User Input → AES-256-GCM Encrypt (on-device) → Encrypted Blob → Database
Database → Encrypted Blob → AES-256-GCM Decrypt (on-device) → User Reads
```

## Key Capabilities

| Capability | Description |
|-----------|-------------|
| **AES-256-GCM** | Military-grade symmetric encryption |
| **Per-Entry Salt/IV** | Unique cryptographic parameters per entry |
| **Client-Side Encryption** | Data encrypted before leaving the device |
| **Zero-Knowledge** | Server never sees plaintext data |
| **Category Organization** | Organize by category (passwords, legal, medical, etc.) |
| **Kill Switch** | Emergency data destruction capability |

## Database Schema

```sql
stealth_vault (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title_encrypted TEXT NOT NULL,     -- AES-256 encrypted
  content_encrypted TEXT NOT NULL,   -- AES-256 encrypted
  iv TEXT NOT NULL,                   -- Initialization vector
  salt TEXT NOT NULL,                 -- Cryptographic salt
  category TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Use Cases

- **Entrepreneurs:** Store business secrets, investor negotiations, IP documentation
- **Lawyers:** Client-privileged communications, case notes
- **Doctors:** Patient notes (HIPAA-compliant local storage)
- **Traders:** Trading strategies, portfolio allocations
- **Journalists:** Source protection, investigation notes

## Competitive Advantage

No major AI assistant offers integrated encrypted storage. Users currently need separate apps (1Password, Notion, encrypted notes) — ShadowTalk combines AI + encrypted storage in one platform.
