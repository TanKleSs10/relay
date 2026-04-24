# Fase 0. Contención operativa inmediata

## Objetivo

Bajar riesgo operativo mientras se ejecuta el refactor, evitando errores manuales, deploys inseguros y pérdida de estado por operación improvisada.

## Alcance

### Incluido

- checklist manual de deploy
- política mínima de backups
- runbooks operativos
- registro consolidado de incidentes
- separación clara de `dev` y `prod`

### Fuera de alcance

- cambios profundos del `wa-engine`
- rediseño de sesiones
- optimización fuerte de API o frontend
- cambios de arquitectura

## Reglas obligatorias

1. No usar `docker compose down -v` en producción salvo mantenimiento explícito y con backup previo.
2. No editar archivos versionados directamente en el VPS.
3. No correr migraciones nuevas sin backup reciente.
4. No hacer deploy sin validar build de frontend y worker.
5. No reiniciar servicios en producción sin revisar logs del servicio afectado.

## Entregables de esta fase

- [Checklist de deploy](./deploy-checklist.md)
- [Política de backups](./backups.md)
- [Runbook de reset de sender](./runbook/reset-sender.md)
- [Runbook de recuperación de sesión](./runbook/recover-session.md)
- [Runbook de reinicio del worker](./runbook/restart-worker.md)
- [Runbook de rollback de deploy](./runbook/rollback-deploy.md)
- [Runbook de migraciones](./runbook/migrations.md)
- [Índice de incidentes](./incidents/README.md)

## Criterio de aceptación

- existe un procedimiento claro de recuperación
- los deploys manuales dejan de depender de memoria operativa
- disminuyen los errores de operación
- producción y desarrollo quedan claramente diferenciados
