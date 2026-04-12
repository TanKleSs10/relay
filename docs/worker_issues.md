# Worker Issues (Observed in MVP)

This doc lists production issues to address during the worker refactor.

## 1) Emojis not supported in messages

**Symptom**
- Messages with emojis fail or are corrupted.

**Likely cause**
- Encoding issues in DB/CSV pipeline (non‑UTF8 or wrong decode path).

**Notes**
- DB refactor should enforce UTF‑8; verify worker payload encoding.

---

## 2) Sender state not restored after campaign pause

**Symptom**
- Senders remain in SENDING/COOLDOWN and never return to CONNECTED.

**Likely cause**
- Missing state transition when campaign is paused or completed.
- Worker does not reset sender state after stopping a campaign.

---

## 3) One session crash breaks all sessions

**Symptom**
- Single WA session failure causes global Puppeteer crash.
- Worker stops and all sessions go down.

**Likely cause**
- Shared browser instance or unhandled Puppeteer errors.
- Missing isolation per sender session.

---

## 4) Sessions unstable / worker crashes frequently

**Symptom**
- Frequent disconnects and restarts.
- Worker process stops unexpectedly.

**Likely cause**
- Unhandled exceptions in provider.
- Missing retry / restart logic for failed sessions.

---

## 5) Anti‑ban rules not calibrated

**Symptom**
- Numbers get blocked too often.

**Likely cause**
- Too aggressive sending (rate/delay).
- No cooldown or rotation logic for long runs.

---

## 6) Campaign finishes while messages still PROCESSING

**Symptom**
- Campaign marked FINISHED while messages remain stuck in PROCESSING.
- Messages stop being sent after campaign closes.

**Likely cause**
- Completion condition only checks PENDING count.
- Does not include PROCESSING and lock expiry.

---

## Next Steps

- Map each issue to worker changes (session manager, dispatch loop, error handling).
- Add logs for each critical transition (campaign state, sender state, session state).
