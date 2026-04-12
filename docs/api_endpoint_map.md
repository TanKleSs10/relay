# API Endpoint Map — Relay MVP (Worker-Aligned)

This doc defines the **minimal API surface** aligned with the current worker
architecture. The API should **not** duplicate worker responsibilities.

## Principles (KISS)

- The **worker writes operational state** directly to the DB.
- The API **reads** operational state and only exposes **explicit admin actions**
  (e.g., reset session).
- Avoid CRUD for internal/operational tables (send_logs, sessions).
- Prefer **few stable endpoints** over large surfaces.

---

## 1) Auth (Public)

**Base path:** `/auth`

- `POST /auth/login`  
  Login, set JWT HttpOnly cookie.

- `GET /auth/me`  
  Returns current authenticated user (cookie-based).

- `POST /auth/logout`  
  Clears JWT cookie.

---

## 2) Users (Admin-only)

**Base path:** `/users`

- `POST /users`  
  Create user (role defaults to USER).

- `GET /users`  
  List users (filters: status, search).

- `PATCH /users/{userId}/status`  
  Activate/disable user.

**Notes**
- Admin-only.  
- Roles are seeded (`ADMIN`, `USER`) and not editable in MVP.

---

## 3) Campaigns (Business)

**Base path:** `/campaigns`

- `POST /campaigns`  
  Create campaign.

- `GET /campaigns`  
  List campaigns.

- `GET /campaigns/{campaignId}`  
  Campaign detail + counters.

- `PATCH /campaigns/{campaignId}/status`  
  Start/pause/finish campaign.

- `DELETE /campaigns/{campaignId}`  
  Allowed only if not ACTIVE.

---

## 4) Messages (Business)

**Base path:** `/messages`

- `POST /campaigns/{campaignId}/messages/upload`  
  Upload CSV to create messages.

- `GET /campaigns/{campaignId}/messages`  
  List messages by campaign (filters: status, recipient).

- `GET /campaigns/{campaignId}/messages/stats`  
  Status counts (pending/processing/sent/failed/no_wa).

- `DELETE /messages/{messageId}`  
  Only if `PENDING`.

**Notes**
- Worker processes `PENDING` → `PROCESSING` → `SENT/FAILED/NO_WA`.
- API should not requeue or deduplicate in MVP.

---

## 5) Senders (Business + Admin Actions)

**Base path:** `/senders`

- `POST /senders`  
  Create sender (label auto-generated if not provided).

- `GET /senders`  
  List senders (filters: status, label, phone_number).

- `GET /senders/{senderId}`  
  Sender detail + current status.

- `PATCH /senders/{senderId}`  
  Update label.

- `POST /senders/{senderId}/reset-session`  
  Clear session and force QR re-auth.

---

## 6) Sessions / QR (Read-only)

**Base path:** `/senders`

- `GET /senders/{senderId}/qr`  
  Read current QR code + timestamp.

- `GET /senders/{senderId}/session`  
  Read technical session state (health, last_seen).

- `GET /senders/{senderId}/session/logs`  
  Read session log events.

**Notes**
- No public mutation endpoints for sessions in MVP.
- Worker is responsible for session lifecycle.

---

## 7) Rules (Business)

**Base path:** `/send-rules`

- `GET /send-rules`  
  Get current rules.

- `PUT /send-rules`  
  Update rules.

---

## 8) Metrics / Dashboard (Read-only)

**Base path:** `/dashboard`

- `GET /dashboard/summary`  
  Basic operational summary:
  - active campaigns
  - active senders
  - messages sent today
  - failures today

---

## 9) System / Health

**Base path:** `/system`

- `GET /health`  
  Basic healthcheck (API alive).

---

## What is **intentionally excluded** (for MVP)

- `send_logs` CRUD endpoints (internal only).
- `messages/requeue` and `messages/deduplicate`.
- `workers/*` admin endpoints.
- `reports/*` downloads.
- `workspaces/*` (Phase 3).

---

## Flow Summary (API + Worker)

1) API creates campaign + messages.  
2) Worker claims messages and updates status directly.  
3) API reads status and exposes it to the UI.  
4) User can pause/resume or reset sender sessions.  

This keeps the surface small, clear, and scalable.
