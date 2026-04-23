# Runbook: migraciones

## Objetivo

Aplicar migraciones de forma segura y evitar fallos operativos en producción.

## Reglas

1. Toda migración debe probarse en local antes de prod.
2. Toda migración debe tener `revision` corta.
3. Toda migración delicada requiere backup previo.

## Checklist previo

- backup reciente disponible
- revisión de `revision` y `down_revision`
- validación local de `alembic upgrade head`
- revisión de impacto sobre datos

## Aplicación

```bash
docker exec -it relay-api-1 bash
alembic upgrade head
```

## Si falla

1. revisar error completo
2. confirmar si hubo rollback automático
3. revisar estado actual:

   ```bash
   alembic current
   ```

4. no reintentar a ciegas
5. documentar causa antes de volver a ejecutar

## Incidente ya conocido

Una migración falló porque el `revision` era demasiado largo para `alembic_version.version_num`. Regla práctica: usar IDs cortos.

## No hacer

- no aplicar migraciones sin backup
- no corregir archivos directamente en prod sin versionarlos
- no asumir que una migración parcialmente fallida quedó aplicada
