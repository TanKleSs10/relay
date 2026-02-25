# Backend Maintainability Checklist

Lista de mejoras para hacer el backend mas mantenible y escalable.

## Arquitectura y capas
- [ ] Separar capa API vs dominio vs infraestructura con contratos claros.
- [ ] Centralizar enums/estados en el dominio y exponerlos via API para evitar desalineaciones.

## Migraciones y esquema
- [ ] Usar Alembic como flujo real de cambios de esquema.
- [ ] Normalizar enums con migraciones (no cambios manuales en BD).

## Logica de negocio
- [ ] Mover validaciones/reglas a `application/usecases`.
- [ ] Mantener rutas como adaptadores delgados.

## Tipado y validacion
- [ ] Endurecer esquemas Pydantic (requeridos vs opcionales).
- [ ] Documentar payloads con ejemplos claros.

## Configuracion
- [ ] Unificar configuracion por ambiente (dev/stage/prod).
- [ ] Consolidar DB_URL, logging y flags en `Settings`.

## Tests
- [ ] Tests basicos de rutas criticas (sender creation, campaign upload, status transitions).
- [ ] Tests de usecases principales.

## Errores y respuestas
- [ ] Manejo consistente de errores (HTTPException con codigos uniformes).
- [ ] Respuestas de error estandarizadas.
