# Backend Maintainability Checklist

Lista de mejoras para hacer el backend mas mantenible y escalable.

## Arquitectura y capas
- [x] Separar capa API vs dominio vs infraestructura con contratos claros.
- [x] Centralizar enums/estados en el dominio y exponerlos via API para evitar desalineaciones.

## Migraciones y esquema
- [x] Usar Alembic como flujo real de cambios de esquema.
- [x] Normalizar enums con migraciones (no cambios manuales en BD).

## Logica de negocio
- [x] Mover validaciones/reglas a `application/usecases`.
- [x] Mantener rutas como adaptadores delgados.

## Tipado y validacion
- [x] Endurecer esquemas Pydantic (requeridos vs opcionales).
- [x] Documentar payloads con ejemplos claros.

## Configuracion
- [x] Unificar configuracion por ambiente (dev/stage/prod).
- [x] Consolidar DB_URL, logging y flags en `Settings`.

## Tests
- [x] Tests basicos de rutas criticas (sender creation, campaign upload, status transitions).
- [x] Tests de usecases principales.

## Errores y respuestas
- [x] Manejo consistente de errores (HTTPException con codigos uniformes).
- [x] Respuestas de error estandarizadas.
