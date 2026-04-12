# 🧩 PHASE 1 — MVP (Engine funcional y estable)

## 🎯 Objetivo

Sistema que:

- envía mensajes correctamente
- no duplica
- respeta estados
- tolera fallos de sesión

---

## 📦 Tablas necesarias (mínimo correcto)

### ✔️ Core (obligatorias)

- `sender_accounts`
- `sender_sessions`
- `campaigns`
- `messages`
- `send_logs`
- `send_rules`
- `workers`

---

## 🔥 Ajustes CRÍTICOS al diseño

### 1. `messages` (la más importante)

Agregar/usar correctamente:

- `status`
- `locked_at`
- `processing_by_worker_id`
- `processing_sender_id`
- `idempotency_key` (UNIQUE)
- `retry_count`
- `max_retries`

👉 Esto soluciona:

- duplicados
- procesamiento concurrente
- control del worker

---

### 2. `campaigns`

Debe controlar ejecución:

- `status` → ACTIVE / PAUSED / etc.

👉 el worker debe leer esto SIEMPRE

---

### 3. `sender_sessions`

Ya lo tienes bien planteado, pero en Phase 1 es obligatorio usar:

- `health_status`
- `restart_count`
- `last_disconnect_at`

👉 esto es lo que estabiliza WA

---

### 4. `send_logs`

No opcional.

👉 esto te salvó hoy con duplicados

---

## ⚠️ Qué NO meter aún

❌ roles complejos  
❌ permisos granulares  
❌ multi-tenant completo  
❌ colas (Kafka/Rabbit)

---

# 🧩 PHASE 2 — Usuarios y control de acceso

## 🎯 Objetivo

Agregar control humano al sistema.

---

## 📦 Tablas que se activan aquí

- `users`
- `roles`
- `permissions`
- `role_permissions`
- `workspace_members`

---

## 🔥 Ajustes clave

### Simplificación recomendada

No compliques:

👉 usa solo:

- roles: ADMIN / USER
- workspace_members: OWNER / OPERATOR

👉 NO necesitas RBAC complejo aún

---

## 🧠 Cambio importante

Ahora:

- campaigns → `created_by_user_id`
- sender_accounts → `created_by_user_id`

---

## ⚠️ Aún NO necesitas

❌ multi-tenant completo  
❌ separación fuerte por workspace

---

# 🧩 PHASE 3 — Multi-tenant + escalabilidad

## 🎯 Objetivo

Separar clientes / áreas → **workspaces**

---

## 📦 Tablas que se vuelven críticas

- `workspaces`
- `workspace_members`
- `campaigns.workspace_id`
- `messages.workspace_id`
- `sender_accounts.workspace_id`
- `sender_sessions.workspace_id`

---

## 🔥 Regla crítica

👉 TODO debe tener `workspace_id`

---

## ⚙️ Ajustes importantes

### 1. Aislamiento real

- campañas solo usan senders del mismo workspace
- sesiones separadas por workspace (filesystem también)

---

### 2. `sender_sessions.auth_dir`

Debe ser:

👉 `/sessions/{workspace_id}/{sender_id}`

---

### 3. Índices por workspace

- `(workspace_id, status)`
- `(workspace_id, campaign_id)`

---

## 🚀 Aquí ya puedes escalar

- múltiples clientes
- múltiples campañas
- múltiples workers

---

# 🧩 PHASE 3.5 — (muy recomendado)

## 🔥 `session_logs` (clave real)

👉 esto no es opcional si quieres estabilidad

Te permite:

- saber por qué se cayó WA
- detectar patrones de bloqueo
- mejorar reglas

---

# 🧩 PHASE 4 — SaaS

## 🎯 Objetivo

Producto real multi-cliente

---

## 📦 Tablas que cobran sentido

- `user_roles` (si creces)
- `campaign_sender_pool`
- facturación (nuevo módulo)

---

## ⚙️ Ajustes

- rate limits por workspace
- métricas por cliente
- dashboards

---

# 🔥 Cambios MÁS IMPORTANTES (resumen brutal)

Si solo aplicas esto, mejoras todo:

---

## 1. `messages` = corazón del sistema

Debe garantizar:

- idempotencia
- locking
- retry

---

## 2. `sender_sessions` = estabilidad WA

Debe tener:

- health_status
- restart_count
- heartbeat

---

## 3. `campaigns.status` = control total

Debe gobernar:

- si se envía o no

---

## 4. `auth_dir` aislado

Debe usar:

- workspace_id
- sender_id
