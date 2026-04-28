# Incident Index

This directory keeps a lightweight catalog of recurring incidents and operational pitfalls found during development and validation.

The goal is simple:

- avoid rediscovering the same failure twice
- preserve root-cause context
- keep recovery and follow-up actions easy to find

## Categories

- `wa-engine`
- `sessions`
- `deploy`
- `migrations`
- `api`
- `frontend`
- `infrastructure`

## Known incidents

1. `Execution context was destroyed` in `whatsapp-web.js`
2. `Target closed` and Chromium-driven worker failures
3. ambiguous `state unknown` session behavior
4. host Nginx vs Docker Nginx conflicts
5. deploy failures caused by local changes on the VPS
6. state loss caused by `docker compose down -v`
7. Alembic migration failure due to overly long `revision` values
8. sender deletion failing because of related records
9. session reset that did not fully clear local auth
10. production frontend depending on manual static builds

## Recommended incident template

For each incident, capture:

- date
- symptom
- impact
- root cause
- temporary mitigation
- permanent fix
- follow-up

## Related documents

- [Worker issues](../worker_issues.md)
- [Session recovery runbook](../runbook/recover-session.md)
- [Migration runbook](../runbook/migrations.md)
