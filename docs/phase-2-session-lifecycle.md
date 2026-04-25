# Fase 2. Sesiones activas/inactivas bajo demanda

## Objetivo

Reducir consumo real de RAM y CPU controlando explícitamente cuándo un sender:

- tiene auth persistida
- tiene QR activo
- tiene cliente Chromium vivo
- está listo para enviar
- está apagado pero reutilizable

La meta no es abaratar `CONNECTED`, sino hacer que `CONNECTED` deje de ser el estado normal.

---

## Hallazgos que guían esta fase

### Observaciones de desarrollo

- el arranque de sesiones y QR produce picos de `200%+` CPU
- el costo fuerte aparece al levantar Chromium
- una sesión conectada tiene un costo base alto
- un sender `IDLE` agrega mucho menos costo que uno `CONNECTED`
- con senders inactivos el baseline baja de forma clara en RAM y PIDs

### Observaciones de producción

- VPS objetivo: `2 vCPU / 4 GB RAM`
- con `0` senders conectados y `4` en `WAITING_QR`, el sistema se mantiene barato
- el baseline pasivo es aceptable
- el riesgo real está en cuántas sesiones vivas existen al mismo tiempo

### Conclusión

La política correcta es:

- muchos senders pasivos
- muy pocos senders activos
- wake-up gradual
- QR serializado
- apagado conservador, no agresivo

---

## Modelo de estados del sender

## Enum propuesto

- `CREATED`
- `INITIALIZING`
- `QR_REQUESTED`
- `WAITING_QR`
- `QR_INACTIVE`
- `AUTHENTICATING`
- `CONNECTING`
- `CONNECTED`
- `IDLE`
- `SENDING`
- `COOLDOWN`
- `DISCONNECTED`
- `ERROR`
- `BLOCKED`

## Significado de cada estado

### `CREATED`

Sender creado, sin sesión activa ni flujo de QR iniciado.

### `INITIALIZING`

Se está levantando runtime para el sender. Puede implicar Chromium arrancando.

### `QR_REQUESTED`

Existe una solicitud explícita para generar QR, pero todavía no hay QR activo disponible.

### `WAITING_QR`

El QR ya fue generado y está disponible para escaneo. Este estado puede implicar runtime vivo.

### `QR_INACTIVE`

El sender necesita reautenticación, pero no hay QR activo ni cliente vivo. Estado pasivo.

### `AUTHENTICATING`

El QR ya fue escaneado y WhatsApp está autenticando la sesión.

### `CONNECTING`

La sesión está terminando de abrir y estabilizarse en WA Web.

### `CONNECTED`

El cliente está vivo y listo para usar.

### `IDLE`

La auth sigue siendo válida, pero el cliente está apagado. Estado pasivo reutilizable.

### `SENDING`

El sender está enviando activamente.

### `COOLDOWN`

Pausa operativa por política o protección.

### `DISCONNECTED`

La sesión cayó, pero se considera recuperable.

### `ERROR`

Fallo que requiere retry, backoff o intervención.

### `BLOCKED`

Estado terminal o administrativo.

---

## Principios de diseño

### 1. `CONNECTED` no debe ser el estado por defecto

En reposo, un sender sano debe terminar en:

- `IDLE`
- o `QR_INACTIVE`

### 2. El QR activo no debe vivir indefinidamente

Si nadie escanea un QR en una ventana corta, el runtime debe destruirse y el sender debe pasar a `QR_INACTIVE`.

### 3. El wake-up debe ser gradual

No más de un wake-up por tick.

### 4. La cantidad de sesiones vivas debe ser explícitamente limitada

Para la VPS objetivo:

- `max_live_sessions = 1` inicialmente

### 5. La máquina de estados debe ser explícita

Nada de inferir todo con reglas implícitas tipo "si no está conectado, reintentar".

---

## Política operativa inicial recomendada

## Variables

- `warm_pool_size = 0`
- `max_live_sessions = 1`
- `max_idle_wakeups_per_tick = 1`
- `qr_bootstrap_concurrency = 1`
- `idle_timeout = 10 min`
- `qr_active_timeout = 3 min`
- `post_send_keepalive = 5 min`

## Justificación

### `warm_pool_size = 0`

El baseline de producción es claramente barato cuando no hay Chromium vivo.

### `max_live_sessions = 1`

Con `2 vCPU / 4 GB RAM`, arrancar y sostener varias sesiones a la vez es riesgoso.

### `max_idle_wakeups_per_tick = 1`

Las mediciones muestran que despertar varias sesiones a la vez crea picos peligrosos.

### `qr_bootstrap_concurrency = 1`

La generación de QR es parte del momento caro y debe ser serial.

### `idle_timeout = 10 min`

Evita apagar demasiado rápido y forzar wake-ups innecesarios.

### `qr_active_timeout = 3 min`

Evita mantener un QR vivo si nadie lo va a escanear.

### `post_send_keepalive = 5 min`

Evita apagar inmediatamente un sender que acaba de usarse.

---

## Máquina de estados propuesta

## Flujo de QR

- `CREATED -> QR_REQUESTED`
- `QR_REQUESTED -> INITIALIZING`
- `INITIALIZING -> WAITING_QR`
- `WAITING_QR -> AUTHENTICATING`
- `WAITING_QR -> QR_INACTIVE`
  - si expira sin escaneo

## Flujo de conexión

- `AUTHENTICATING -> CONNECTING`
- `CONNECTING -> CONNECTED`
- `CONNECTING -> DISCONNECTED`
- `CONNECTING -> ERROR`

## Flujo pasivo

- `CONNECTED -> IDLE`
  - por inactividad
- `IDLE -> INITIALIZING`
  - cuando campaña o uso explícito lo requiere

## Flujo de envío

- `CONNECTED -> SENDING`
- `SENDING -> CONNECTED`
- `SENDING -> COOLDOWN`
- `SENDING -> DISCONNECTED`
- `SENDING -> ERROR`

## Flujo de recovery

- `ERROR -> DISCONNECTED`
- `DISCONNECTED -> INITIALIZING`
- `DISCONNECTED -> QR_REQUESTED`
  - si se detecta auth inválida
- `QR_INACTIVE -> QR_REQUESTED`
  - solo cuando el usuario solicita QR

---

## Estrategia funcional

## En reposo

- la mayoría de senders deben estar en `IDLE` o `QR_INACTIVE`
- `SessionManager` no debe hacer polling costoso sobre esos estados

## En QR

- no generar QR automáticamente en loop
- generar QR solo cuando:
  - el usuario lo pide
  - un reset manual lo requiere
- si expira:
  - destruir runtime
  - pasar a `QR_INACTIVE`

## En campaña

- usar primero senders `CONNECTED`
- si no hay capacidad suficiente:
  - despertar un `IDLE`
- no exceder `max_live_sessions`

## Después del envío

- no apagar inmediatamente
- aplicar `post_send_keepalive`
- luego volver a `IDLE`

---

## Orden de implementación

## Slice 1. Redefinición del modelo

### Objetivo

Cerrar el enum y la semántica de estados antes de tocar lógica nueva.

### Tareas

- crear nueva migración del enum
- actualizar backend, worker y frontend
- documentar transiciones válidas

## Slice 2. QR pasivo

### Objetivo

Separar claramente "necesita QR" de "QR activo".

### Tareas

- implementar `QR_REQUESTED`
- implementar `QR_INACTIVE`
- agregar `qr_active_timeout`
- dejar de regenerar QR automáticamente
- generar QR solo por acción explícita desde UI

## Slice 3. Sesión pasiva sana

### Objetivo

Formalizar `IDLE` como estado normal sano y barato.

### Tareas

- mantener `IDLE` como estado pasivo estable
- reforzar apagado por inactividad
- aplicar `max_live_sessions`
- mantener wake-up gradual

## Slice 4. Política post-envío

### Objetivo

Evitar wake-ups innecesarios después de una campaña o lote corto.

### Tareas

- agregar `post_send_keepalive`
- apagar a `IDLE` solo después de la ventana definida

## Slice 5. Integración con campañas

### Objetivo

Usar el pool activo con capacidad limitada.

### Tareas

- despertar senders solo cuando la campaña lo requiera
- evitar arranques concurrentes
- medir latencia `IDLE -> CONNECTED`

---

## Métricas mínimas recomendadas

- `live_sessions_count`
- `idle_entered`
- `idle_wakeup_started`
- `idle_wakeup_succeeded`
- `idle_wakeup_failed`
- `idle_wakeup_duration_ms`
- `qr_requested`
- `qr_expired`
- `qr_inactive_entered`
- `wakeups_in_progress`

---

## Riesgos a cuidar

- hacer `IDLE` demasiado agresivo y aumentar latencia de campaña
- despertar varias sesiones a la vez y saturar CPU
- mantener QR vivo sin beneficio real
- mezclar de nuevo "necesita QR" con "QR activo"
- apagar inmediatamente después de enviar y forzar reinit costosos

---

## Criterios de aceptación

## Técnicos

- baja observable de RAM y CPU en reposo
- `IDLE` y `QR_INACTIVE` no disparan polling caro
- no hay wake-ups concurrentes
- no hay loops automáticos de QR

## Operativos

- una campaña puede despertar senders bajo demanda
- el arranque de campaña sigue siendo aceptable
- los estados son legibles y coherentes

## Producto

- el usuario puede pedir QR explícitamente
- el sistema no mantiene QR activo sin intención real
- la UI refleja bien estados pasivos vs activos

---

## Resultado esperado

Al cerrar esta fase deberíamos tener:

- menos RAM consumida en reposo
- menos CPU basal
- menos PIDs
- mejor control del flujo QR
- menos Chromium vivos simultáneamente
- una máquina de estados del sender más explícita y mantenible
