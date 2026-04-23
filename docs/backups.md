# Política mínima de backups

## Objetivo

Evitar pérdida de datos por errores operativos, migraciones fallidas o uso incorrecto de Docker.

## Activos críticos

- volumen `postgres_data`
- volumen `whatsapp_auth`
- configuración de `nginx`
- certificados si viven en el host

## Cuándo hacer backup obligatorio

1. Antes de una migración estructural.
2. Antes de cambios de sesión o auth en producción.
3. Antes de mantenimiento manual del VPS.
4. Antes de cualquier operación destructiva.

## Cuándo se recomienda snapshot del droplet

- antes de un refactor delicado del worker
- antes de tocar red, nginx o certificados
- antes de un cambio grande de despliegue

## Regla crítica

No usar `docker compose down -v` en producción salvo mantenimiento explícito y con backup previo confirmado.

## Backup mínimo sugerido

### Base de datos
```bash
docker exec -t relay-db-1 pg_dump -U "$DB_USER" "$DB_NAME" > backup.sql
```

### Snapshot del VPS
- usar snapshot del droplet desde DigitalOcean si el cambio es delicado

## Verificación mínima

Antes de tocar producción, confirmar:

- fecha del último backup
- ubicación del backup
- si el dump se generó correctamente
- si el snapshot se completó

## Restauración

La restauración debe ejecutarse solo con procedimiento documentado y ventana controlada. No improvisar restauraciones en caliente sin evaluar impacto.
