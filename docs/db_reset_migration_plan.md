# DB Reset Migration Plan (Workspace-Ready)

This plan assumes a full reset of the database. We will create a new baseline migration that defines the new schema in one shot and drop the existing schema beforehand in the deployment environment.

## Goals
- Workspace isolation across all domain tables.
- Separate session runtime state from sender business identity.
- Add execution/runtime observability for campaigns and sessions.
- Keep the new baseline clean and easy to apply with `alembic upgrade head`.

---

## Migration Strategy (Reset)

### 1) Pre-reset (deployment step)
- Drop existing schema in the DB (or recreate the DB).
- Ensure `DB_URL` points to the clean DB.

### 2) New Alembic baseline
- Create a **new baseline migration** (single file) that creates:
  - All enums
  - All tables
  - All FKs, indexes, uniques

### 3) Apply
```bash
cd service/backend
alembic upgrade head
```

---

## New Baseline Schema (vNext)

### Global / Auth
- `users`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles` (optional, keep for future)

### Workspace
- `workspaces`
- `workspace_members`

### Sender domain
- `sender_accounts`
- `sender_sessions`
- `session_logs`

### Campaign domain
- `campaigns`
- `messages`

### Execution / Ops
- `send_rules`
- `workers`
- `send_logs`

---

## Migration Order (create)
1. enums
2. core tables: `users`, `roles`, `permissions`
3. join tables: `role_permissions`, `user_roles`
4. `workspaces`, `workspace_members`
5. `sender_accounts`
6. `sender_sessions`, `session_logs`
7. `campaigns`
8. `messages`
9. `send_rules`
10. `workers`
11. `send_logs`
12. indexes + unique constraints

---

## Required Enums
- `user_status` → `ACTIVE`, `INACTIVE`
- `workspace_status` → `ACTIVE`, `ARCHIVED`
- `workspace_member_role` → `OWNER`, `OPERATOR`
- `workspace_member_status` → `ACTIVE`, `INACTIVE`
- `sender_account_status` → `CREATED`, `INITIALIZING`, `WAITING_QR`, `CONNECTED`, `SENDING`, `COOLDOWN`, `DISCONNECTED`, `BLOCKED`, `ERROR`
- `sender_session_health` → `HEALTHY`, `DEGRADED`, `DEAD`
- `campaign_status` → `CREATED`, `ACTIVE`, `PAUSED`, `FINISHED`, `FAILED`
- `message_status` → `PENDING`, `PROCESSING`, `SENT`, `FAILED`, `NO_WA`
- `worker_status` → `ONLINE`, `OFFLINE`, `BUSY`
- `worker_type` → `QR`, `SESSION`, `CAMPAIGN`
- `session_log_event` → `QR_GENERATED`, `READY`, `DISCONNECTED`, `AUTH_FAILURE`, `RESTARTED`, `DEAD`

---

## Critical Constraints & Indexes

### Uniques
- `users.email`
- `roles.name`
- `permissions.code`
- `workspaces.slug`
- `workspace_members (workspace_id, user_id)`
- `sender_sessions.sender_account_id`
- `sender_sessions.session_key`
- `messages.idempotency_key`
- `workers.worker_name`

### Indexes
- `workspace_members(workspace_id)`
- `workspace_members(user_id)`
- `sender_accounts(workspace_id, status)`
- `sender_sessions(health_status)`
- `sender_sessions(last_heartbeat_at)`
- `campaigns(workspace_id, status)`
- `messages(workspace_id, status)`
- `messages(campaign_id, status)`
- `messages(locked_at)`
- `send_logs(workspace_id, created_at)`
- `session_logs(sender_account_id, created_at)`

---

## Notes
- UUIDs are recommended. If we keep integer IDs for now, align all new tables to integers consistently.
- `sender_accounts` should be the business identity; `sender_sessions` holds runtime state and QR data.
- `campaigns` should include counters if you want fast dashboard metrics.
- This baseline replaces all previous migrations. Existing migrations should be archived.

---

## Next Steps
1) Approve the schema (UUID vs INT decision).
2) Generate the baseline migration file.
3) Reset DB in deployment.
4) Apply migration and re-seed minimal data (workspace, admin user).
