# Message Sending Map (Backend + Worker)

This document explains the message sending flow and where to implement each
piece. It is written to help debug and extend the system without breaking
the architecture.

## High-level flow

1) UI creates campaign + messages.
2) UI dispatches campaign.
3) Backend assigns a worker.
4) Worker loop consumes messages and sends them.
5) Worker updates message + campaign status.

## Flow diagram (ASCII)

```
UI (web)                  Backend (FastAPI)                 Worker (WhatsApp)
---------                 -----------------                 -----------------
Create campaign  ----->  POST /campaigns                   (none)
Add messages     ----->  POST /messages
Click "Dispatch" ----->  POST /campaigns/{id}/dispatch  -> worker_states.current_campaign_id = id
                                                   |
                                                   v
                                          Scheduler loop (every 3s)
                                          - read worker_state
                                          - load READY senders
                                          - load QUEUED messages
                                          - send via MessageProvider
                                          - update message status
                                          - DONE -> clear worker
```

## Backend: who does what

### Entry points (HTTP)
- `service/backend/src/api/routes/campaigns.py`
  - `POST /campaigns/{id}/dispatch`
  - Validates campaign status.
  - Calls `dispatch_campaign` usecase.

### Usecases
- `service/backend/src/application/usecases/campaign_usecases.py`
  - `dispatch_campaign`
  - Changes campaign -> `PROCESSING`.
  - Chooses a worker via `get_idle_worker`.
  - Assigns `current_campaign_id`.

### Worker assignment
- `service/backend/src/api/service/workers.py`
  - `get_idle_worker`
    - Must include `IDLE` workers.
    - Also includes `RUNNING` with `current_campaign_id IS NULL`.
  - `assign_campaign`
    - Sets worker status `RUNNING` and `current_campaign_id`.

## Worker: who does what

### Bootstrap
- `service/workers/whatsapp/src/app.ts`
  - Connects DB.
  - Initializes worker state.
  - Starts scheduler loop.

### Scheduler
- `service/workers/whatsapp/src/scheduler/loop.ts`
  - Runs every 3s.
  - Two responsibilities:
    1) QR initialization for `QR_REQUIRED` senders.
    2) Campaign dispatch based on `current_campaign_id`.

### Dispatch logic (core)
- `service/workers/whatsapp/src/application/campaign-dispatch.service.ts`
  - Reads the active worker state.
  - If no `current_campaign_id`, no work.
  - Loads READY senders.
  - Loads QUEUED messages for the campaign.
  - Sends N messages (current limit is small).
  - Marks messages SENT/FAILED.
  - When no queued messages remain:
    - Mark campaign DONE.
    - Set worker status `IDLE`.
    - Set `current_campaign_id = NULL`.

### Provider abstraction
- `service/workers/whatsapp/src/domain/message-provider.interface.ts`
  - Abstract interface for WhatsApp provider.
- `service/workers/whatsapp/src/infrastructure/providers/whatsapp-web.provider.ts`
  - Only file that knows `whatsapp-web.js`.
  - Should emit QR, ready, disconnect events.
  - Should only be called from services, never directly by loop.

## Critical DB tables (minimal fields)

### campaigns
- `id`
- `status` (`CREATED`, `QUEUED`, `PROCESSING`, `DONE`, `FAILED`)

### messages
- `id`
- `campaign_id`
- `status` (`QUEUED`, `SENT`, `FAILED`, `RETRY`)
- `to`
- `body`

### sender_accounts
- `id`
- `status` (`QR_REQUIRED`, `READY`, `BLOCKED`, `COOLDOWN`)
- `phone_number`
- `qr_code` (data URL)

### worker_states
- `id`
- `worker_name`
- `status` (`IDLE`, `RUNNING`, `ERROR`)
- `current_campaign_id`
- `last_heartbeat`

## Expected runtime flow (debug checklist)

1) Campaign is `CREATED` or `QUEUED`.
2) `POST /campaigns/{id}/dispatch` returns 200/201.
3) `worker_states.current_campaign_id` is set.
4) Worker log shows it detects `current_campaign_id`.
5) Worker log shows it loads READY senders.
6) Worker log shows it loads QUEUED messages.
7) Worker sends messages and updates status.
8) When no queued messages remain:
   - Campaign -> `DONE`
   - Worker -> `IDLE` + `current_campaign_id NULL`

## Basic anti-ban and rotation (current)

- Global limit per tick: 6 messages.
- Per-sender limit per tick: 2 messages.
- Delay/jitter between sends: 300–800 ms.
- Sender cooldown: after 3 consecutive failures, sender is marked `COOLDOWN`.

## Known failure points and fixes

- **409 No idle workers available**
  - Worker status is not `IDLE` and `current_campaign_id` is not NULL.
  - Fix: clear assignment or update `get_idle_worker`.

- **Campaign already processing**
  - Campaign status is `PROCESSING`.
  - Fix: set to `CREATED` or `QUEUED`, or finish/cleanup.

- **Worker running but does nothing**
  - `current_campaign_id` is NULL or invalid.
  - No READY senders.
  - No messages QUEUED.
  - Check DB state and worker logs.

## Minimal change points to implement sending

1) Ensure dispatch endpoint assigns a worker and sets campaign to `PROCESSING`.
2) Ensure worker loop reads `current_campaign_id`.
3) Ensure dispatch service selects QUEUED messages by campaign.
4) Ensure dispatch service updates message status after send.
5) Ensure worker clears `current_campaign_id` when campaign is done.
