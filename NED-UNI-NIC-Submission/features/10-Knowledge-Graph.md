# Feature Document: Knowledge Graph

## Overview

The Knowledge Graph is ShadowTalk's **personal knowledge management system** that captures, connects, and surfaces insights from user conversations. It automatically extracts entities, relationships, and key information, building a searchable knowledge base over time.

## How It Works

1. AI analyzes conversations for extractable knowledge
2. Entities are identified and categorized (facts, preferences, projects, contacts)
3. Connections between entities are mapped automatically
4. Knowledge is searchable and can be referenced in future conversations
5. Snapshots preserve the state of knowledge over time

## Key Capabilities

| Capability | Description |
|-----------|-------------|
| **Auto-Extraction** | AI automatically extracts knowledge from conversations |
| **Entity Categorization** | Facts, preferences, projects, contacts, decisions |
| **Connection Mapping** | Relationships between knowledge entities |
| **Confidence Scoring** | Each entry has a confidence score |
| **Reference Tracking** | Track how often knowledge is referenced |
| **Snapshots** | Version-controlled knowledge snapshots |
| **Search** | Full-text search across all knowledge entries |

## Database Schema

```sql
knowledge_entries (id, user_id, title, content, entry_type, tags[], connections[], confidence, access_count, ...)
knowledge_snapshots (id, user_id, version, snapshot_data, entity_count, relationship_count, checksum, ...)
```

## Privacy

- All knowledge is user-scoped (RLS-protected)
- Knowledge never crosses user boundaries
- Users can delete individual entries or entire knowledge base
- Snapshots allow point-in-time recovery
