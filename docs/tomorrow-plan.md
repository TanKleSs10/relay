# Tomorrow Plan

## 1) Campaign state machine
- [x] Define allowed transitions.
- [x] Block invalid transitions (backend).
- [x] Validate status before dispatch and before completion.

## 2) Worker reporting to frontend
- [x] Update worker-count/availability logic.
- [x] Treat `RUNNING` + `current_campaign_id NULL` as idle in the UI.
- [ ] Ensure the UI shows clear messaging when no workers are available.

## 3) Basic anti-ban + rotation rules
- [ ] Simple rotation across READY senders.
- [ ] Per-sender max messages per tick.
- [ ] Small delay or jitter between sends (minimal, MVP-safe).

## 4) UI guardrails
- [x] Do not allow campaign deletion while status is `PROCESSING`.
