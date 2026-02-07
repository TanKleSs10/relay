# Documento Técnico — Relay

## 🧠 Descripción general

**Relay** es un sistema de _message dispatch_ diseñado para ejecutar envíos masivos de mensajes de forma controlada, aplicando reglas anti-bloqueo y separación clara entre **orquestación**, **ejecución** y **canal de envío**.

Este documento define el **alcance técnico del MVP**, cuyo objetivo es **demostrar viabilidad**, no operar a gran escala ni entrar en uso productivo definitivo.

---

## 🎯 Objetivos del MVP

- Validar la arquitectura general del sistema
- Demostrar:
  - Registro de números WhatsApp vía QR
  - Encolado de mensajes desde CSV
  - Ejecución en background mediante worker
  - Aplicación de reglas de envío
- Servir como base para:
  - negociación (bono / rol)
  - evolución a v1
  - portafolio técnico

---

## 🚫 Fuera de alcance explícito

Este MVP **NO incluye**:

- Autenticación / usuarios / roles
- UI completa o dashboard
- Uso productivo continuo
- SLA o soporte
- SMS / Email
- API pública
- Multi-tenant
- Facturación

Cualquier extensión fuera de este alcance requiere **una nueva fase formal**.

---

## 🏗️ Arquitectura general

```
UI mínima / CLI
        ↓
      API (FastAPI)
        ↓
   PostgreSQL  ← contrato central
        ↑
     Worker (Python)
        ↓
 WhatsApp Provider (Web-based)
```

### Principios clave

- La **API no envía mensajes**
- El **worker no expone endpoints**
- El **provider no contiene lógica de negocio**
- La **BD es el único punto de coordinación**

---

## 🧱 Componentes del sistema

### 1️⃣ API (Orquestación)

Responsable de:

- Configurar reglas de envío
- Registrar números emisores
- Cargar mensajes (CSV)
- Calcular capacidad y estimaciones
- Exponer estado del sistema

### 2️⃣ Worker (Ejecución)

Responsable de:

- Leer mensajes encolados
- Leer reglas activas
- Leer números disponibles (`READY`)
- Ejecutar envíos con delays
- Actualizar estados y métricas

### 3️⃣ WhatsApp Provider

Responsable de:

- Gestionar sesiones WhatsApp Web
- Generar QR
- Detectar sesión activa
- Reportar estado del número

---

## 🗃️ Modelo de datos (entidades)

### `sender_accounts`

Registra números emisores.

- `status`: `QR_REQUIRED | READY | COOLDOWN | BLOCKED | DISCONNECTED`
- Solo `READY` puede enviar
- El provider controla el estado
- El worker actualiza métricas

---

### `campaigns`

Agrupador lógico de envíos.

- `status`: `DRAFT | QUEUED | PROCESSING | COMPLETED | PAUSED`

---

### `message_queue`

Cola persistente de mensajes.

- Cada fila = 1 mensaje
- `status`: `QUEUED | PROCESSING | SENT | FAILED`
- Lock lógico por estado
- Auditoría completa por mensaje

---

### `worker_rules`

Configuración activa del worker.

- Delays
- Límites por número
- Pausas
- Ventana horaria
- Solo una regla activa

---

## 🔄 Flujo operativo del sistema

### 1️⃣ Registro de números WhatsApp

1. API crea `sender_account`
2. Provider genera QR
3. UI muestra QR
4. Usuario escanea
5. Provider valida sesión
6. Estado cambia a `READY`

---

### 2️⃣ Carga de mensajes

1. Usuario carga CSV
2. API valida estructura
3. API valida variables del template
4. Se crean registros `QUEUED` en `message_queue`

---

### 3️⃣ Estimación de capacidad

- API calcula:
  - mensajes en cola
  - números `READY`
  - reglas activas
- Devuelve:
  - tiempo estimado
  - riesgo
  - capacidad disponible

---

### 4️⃣ Dispatch

1. API marca campaña como `QUEUED`
2. Worker detecta mensajes pendientes
3. Worker ejecuta envíos
4. Actualiza estados
5. Termina campaña

---

## 📄 CSV — Reglas y validaciones

### Columnas mínimas

```csv
phone_number,name,b_reference,…
```

### Reglas

- CSV válido
- Encabezados obligatorios
- Máx 20 filas (demo)
- Teléfono no vacío
- Variables completas

---

## ✉️ Mensajes dinámicos

### Template global (recomendado)

Definido en el body del request:

```text
Hola {{name}}, tu saldo es {{balance}}.
```

- Las variables deben existir en el CSV
- Si falta una variable → error previo
- El worker recibe mensajes ya renderizados

---

## 🛑 Warm-up de números

- **No se implementa en el MVP**
- Se documenta como recomendación operativa
- No se simulan conversaciones
- Se asume que los números ya tienen historial

---

## 📡 Endpoints del MVP (resumen)

- `/health`
- `/senders`
- `/senders/{id}/qr`
- `/worker/rules`
- `/campaigns`
- `/campaigns/{id}/messages/upload`
- `/campaigns/{id}/estimate`
- `/campaigns/{id}/dispatch`
- `/campaigns/{id}/status`

---

## 🚀 Evolución posterior (no implementada)

- v1: hasta 10 números WhatsApp
- Pool dinámico
- SMS / Email
- API para desarrolladores
- SaaS multi-tenant
- Licenciamiento comercial

---

## 🏁 Cierre

Este MVP valida la **arquitectura**, el **flujo operativo** y la **viabilidad técnica** del sistema.  
Cualquier uso productivo, escalamiento o extensión requiere **formalización adicional**.
