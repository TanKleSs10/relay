# Migraciones con Alembic

Guia rapida para crear y aplicar migraciones en este proyecto.

## Requisitos
- Tener `DB_URL` definido en el entorno.
- Dependencias instaladas.

Ejemplo:
```bash
cd service/backend
pip install -r requirements.txt
export DB_URL=postgresql://user:pass@host:5432/dbname
```

## Comandos basicos

### Crear una migracion nueva (autogenerada)
```bash
cd service/backend
alembic revision --autogenerate -m "descripcion-corta"
```
- Alembic compara los modelos vs la BD y genera el script.
- Revisa el archivo creado en `service/backend/alembic/versions/`.

### Aplicar migraciones pendientes
```bash
cd service/backend
alembic upgrade head
```

### Ver el estado actual
```bash
cd service/backend
alembic current
alembic history
```

### Revertir una migracion
```bash
cd service/backend
alembic downgrade -1
```

## Primer setup si la BD ya existe
Si la BD ya tiene el esquema (tablas creadas manualmente o por otro proceso):
```bash
cd service/backend
alembic revision --autogenerate -m "baseline"
alembic stamp head
```
- `stamp head` marca las migraciones como aplicadas sin ejecutar DDL.

## Notas sobre enums en Postgres
- Alembic no siempre maneja cambios de enums automaticamente.
- Si agregas un valor, edita la migracion y usa:
  ```sql
  ALTER TYPE sender_account_status ADD VALUE 'WAITING_QR';
  ```
- Si necesitas reemplazar valores, normalmente hay que crear un enum nuevo y hacer `ALTER TABLE ... USING`.

## Buenas practicas
- Una migracion por cambio logico.
- Revisa y ajusta las migraciones autogeneradas antes de aplicar.
- No edites migraciones ya aplicadas en entornos compartidos.
