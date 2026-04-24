# Checklist manual de deploy

## Regla crítica

No usar `docker compose down -v` en producción. Ese comando elimina volúmenes y puede borrar la base de datos y el estado de auth de WhatsApp.

## Antes del deploy

1. Confirmar rama y commit a desplegar.
2. Confirmar que el árbol local está limpio.
3. Revisar si el cambio incluye:
   - migraciones
   - cambios en `docker-compose`
   - cambios en `nginx`
   - cambios en auth o sesiones
4. Validar localmente:
   - build de frontend
   - build del worker
   - sintaxis del backend
5. Si hay migraciones o cambios delicados:
   - crear backup o snapshot
6. Confirmar que `prod` y `dev` no estén mezclando archivos o comandos.

## Durante el deploy

1. Entrar al VPS y revisar estado actual:

   ```bash
   docker ps
   ```

2. Confirmar que no hay cambios locales versionados:

   ```bash
   git status
   ```

3. Actualizar código de forma segura.
4. Si el frontend depende de `dist`, reconstruirlo:

   ```bash
   cd service/frontend && npm run build
   ```

5. Si hay migraciones:

   ```bash
   docker exec -it relay-api-1 bash
   alembic upgrade head
   ```

6. Levantar servicios con rebuild si aplica:

   ```bash
   docker compose up -d --build
   ```

## Después del deploy

1. Revisar logs:

   ```bash
   docker logs relay-api-1 --tail 100
   docker logs relay-wa-engine-1 --tail 100
   docker logs relay-nginx-1 --tail 100
   ```

2. Probar login.
3. Probar `/auth/me`.
4. Probar listado de senders.
5. Probar dashboard.
6. Si el cambio toca sesiones:
   - probar QR
   - probar reset de sesión
   - validar que el worker siga arriba

## Señales de alarma

- `502` desde nginx
- `host not found in upstream "api"`
- worker reiniciando en loop
- migración fallida
- sender en `state unknown` repetido
- frontend cargando un build viejo
