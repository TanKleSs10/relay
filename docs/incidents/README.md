# Índice de incidentes

## Objetivo

Consolidar los incidentes recurrentes para no volver a analizarlos desde cero.

## Categorías

- `wa-engine`
- `sesiones`
- `deploy`
- `migraciones`
- `api`
- `frontend`
- `infraestructura`

## Incidentes ya identificados

1. `Execution context was destroyed` en `whatsapp-web.js`
2. `Target closed` / caída del worker por Chromium
3. `state unknown; skipping transition`
4. conflicto entre Nginx del host y Nginx en Docker
5. deploy fallido por cambios locales en VPS
6. pérdida de estado por `docker compose down -v`
7. migración fallida por `revision` demasiado larga en Alembic
8. delete de sender sin cascada de sesión
9. reset de sesión que no limpiaba auth local
10. frontend prod dependiendo de build manual

## Formato recomendado por incidente

- fecha
- síntoma
- impacto
- causa raíz
- mitigación temporal
- solución definitiva
- follow-up

## Referencias

- [Worker issues](../worker_issues.md)
- [Runbook de recuperación de sesión](../runbook/recover-session.md)
- [Runbook de migraciones](../runbook/migrations.md)
