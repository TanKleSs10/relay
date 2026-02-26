# Project Tasks

## Bugs
- [x] [HIGH] Worker dispatch not sending messages; add instrumentation and fix send flow end-to-end (pending for tomorrow).
- [x] [MED] Worker state can stay RUNNING with null campaign; adjust dispatch to treat this as IDLE or auto-fix.
- [x] [MED] Frontend dispatch returns 409 without user-facing explanation; show clear error when no idle workers.
- [x] [LOW] QR generation loop reinitializes senders repeatedly; skip senders with existing `qr_code`.

## Performance
- [x] [MED] Avoid polling QR loop when no `QR_REQUIRED` senders; add backoff or longer interval.
- [x] [MED] Batch message updates to reduce DB round-trips (SENT/FAILED).
- [x] [LOW] Add lightweight indexes for `messages(campaign_id,status)` and `sender_accounts(status)`.

## Features
- [x] [HIGH] Campaign completion: mark DONE, release worker, and clear campaign assignment.
- [x] [MED] Worker selection strategy (round-robin or least-loaded).
- [x] [MED] Add API endpoint to reset worker to IDLE.
- [x] [LOW] Persist phone number on READY in DB and show in UI.

## Maintainability
- [x] [MED] Unify enum types between backend and worker with shared constants or docs.
- [x] [MED] Add structured logging for worker loops and dispatch.
- [x] [LOW] Add basic worker health endpoint.

## Testing
- [x] [MED] Add smoke tests for `/campaigns/{id}/dispatch` and worker assignment.
- [x] [LOW] Add tests for QR generation and READY transition handling.
