# Backend Refactor Tasks (by Entity)

Track the work in small, incremental steps. Each task should be completed before moving to the next.

## Auth

- [ ] Add `/auth/me` endpoint (returns current user from cookie).
- [ ] Add `/auth/logout` endpoint (clears JWT cookie).
- [ ] Add auth guard dependency (`require_user`) in protected routes.
- [ ] Add permission guard dependency (policy check by permission code).
- [ ] Add JWT refresh strategy (optional, later).

## User

- [ ] Create `users` service with CRUD (create, list, get by id).
- [ ] Add `users` routes (admin-only for create/list).
- [ ] Add password hashing on create (using security service).
- [ ] Add user status update (ACTIVE/INACTIVE).

## Role & Permission

- [ ] Create seed for permissions + roles (already partially done; validate list).
- [ ] Add `roles` read-only endpoint.
- [ ] Add `permissions` read-only endpoint.
- [ ] Add mapping service for role-permission updates.

## Workspace

- [ ] Add `workspaces` service (create/list).
- [ ] Add `workspace_members` service (add/remove users).
- [ ] Add routes for workspace membership.
- [ ] Decide workspace selection strategy (default vs selected).

## Sender

- [ ] Create `sender_sessions` service (read/update status + QR fields).
- [ ] Add `sender_sessions` read endpoint.
- [ ] Add `session_logs` service (append + list).
- [ ] Remove sender runtime fields from API responses (if still present).

## Campaign

- [ ] Add counters update logic (total/sent/failed) on message changes.
- [ ] Add campaign metrics to dashboard endpoint (optional).
- [ ] Add campaign FAILED handling (if needed).

## Messages

- [ ] Add `NO_WA` status handling in API responses.
- [ ] Ensure idempotency_key is required in create/update.
- [ ] Add `max_retries` usage in retry logic.

## Workers

- [ ] Update workers table usage for UUID.
- [ ] Add worker heartbeat update endpoint.

## Infrastructure

- [ ] Add `auth_middleware` tests (smoke).
- [ ] Add seed verification command (optional).
