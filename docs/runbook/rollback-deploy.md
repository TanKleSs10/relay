# Runbook: rollback de deploy

## Cuándo usarlo

- cuando un deploy rompe login
- cuando el worker deja de iniciar
- cuando una migración o cambio de config deja el sistema inestable

## Regla

Rollback solo con commit identificado y validación posterior.

## Procedimiento general

1. identificar último commit sano
2. posicionar el repo en ese commit
3. reconstruir servicios afectados
4. validar API, worker y frontend

## Validaciones mínimas post-rollback

- login funciona
- `/auth/me` responde
- senders cargan
- worker permanece `Up`
- nginx responde correctamente

## Advertencia

Si hubo migraciones destructivas, el rollback de código puede no ser suficiente. Evaluar compatibilidad antes de ejecutar rollback.
