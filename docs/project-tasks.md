# Project Tasks

## Bugs
- [ ] [HIGH] Worker dispatch not sending messages; add instrumentation and fix send flow end-to-end (pending for tomorrow).
- [ ] [MED] Worker state can stay RUNNING with null campaign; adjust dispatch to treat this as IDLE or auto-fix.
- [ ] [MED] Frontend dispatch returns 409 without user-facing explanation; show clear error when no idle workers.
- [ ] [LOW] QR generation loop reinitializes senders repeatedly; skip senders with existing `qr_code`.

## Performance
- [ ] [MED] Avoid polling QR loop when no `QR_REQUIRED` senders; add backoff or longer interval.
- [ ] [MED] Batch message updates to reduce DB round-trips (SENT/FAILED).
- [ ] [LOW] Add lightweight indexes for `messages(campaign_id,status)` and `sender_accounts(status)`.

## Features
- [ ] [HIGH] Campaign completion: mark DONE, release worker, and clear campaign assignment.
- [ ] [MED] Worker selection strategy (round-robin or least-loaded).
- [ ] [MED] Add API endpoint to reset worker to IDLE.
- [ ] [LOW] Persist phone number on READY in DB and show in UI.

## Maintainability
- [ ] [MED] Unify enum types between backend and worker with shared constants or docs.
- [ ] [MED] Add structured logging for worker loops and dispatch.
- [ ] [LOW] Add basic worker health endpoint.

## Testing
- [ ] [MED] Add smoke tests for `/campaigns/{id}/dispatch` and worker assignment.
- [ ] [LOW] Add tests for QR generation and READY transition handling.
