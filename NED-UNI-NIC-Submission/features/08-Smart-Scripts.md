# Feature Document: Smart Scripts

## Overview

Smart Scripts is ShadowTalk's **AI-powered task automation engine**. Users can create, store, and execute automated scripts triggered by events, schedules, or manual activation — turning repetitive knowledge work into one-click automations.

## How It Works

1. User describes the automation they need in natural language
2. AI generates a script with the appropriate logic
3. Script is stored with a trigger configuration (manual, scheduled, event-based)
4. When triggered, the script executes and logs output
5. Execution history is tracked for auditing

## Key Capabilities

| Capability | Description |
|-----------|-------------|
| **Natural Language Creation** | Describe automation in plain English |
| **Multiple Trigger Types** | Manual, scheduled (cron), event-based |
| **Execution Logging** | Full audit trail of every execution |
| **Error Handling** | Automatic error capture and reporting |
| **Script Library** | Save and organize scripts by category |
| **Active/Inactive Toggle** | Enable/disable scripts without deletion |

## Use Cases

1. **Daily Report Generation** — Automatically compile daily metrics
2. **Email Draft Automation** — Generate follow-up emails from meeting notes
3. **Data Processing** — Transform CSV/JSON data into structured reports
4. **Content Scheduling** — Generate social media posts on a schedule
5. **Compliance Checks** — Run automated compliance reviews weekly

## Database Schema

```sql
automation_scripts (id, user_id, name, description, script_code, trigger_type, trigger_config, is_active, run_count, ...)
script_executions (id, script_id, user_id, status, output, error, started_at, completed_at)
```
