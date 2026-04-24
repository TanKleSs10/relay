# Roadmap de estabilización y optimización de la MVP

## Objetivo general

Llevar la MVP a un estado estable en producción usando la arquitectura actual, priorizando:

1. estabilidad del `wa-engine`
2. reducción de consumo de RAM/CPU
3. control real del ciclo de vida de sesiones
4. menor riesgo de bloqueo en envíos
5. mejora de tiempos de respuesta de API y frontend
6. CI/CD para despliegues más seguros
7. soporte controlado para envío de imágenes mediante Cloudinary

## Criterio rector

En esta etapa no se prioriza:

- microservicios
- GraphQL
- RabbitMQ
- cambio a Baileys
- event-driven completo
- rediseño profundo de arquitectura

La prioridad actual es estabilidad operativa, no expansión arquitectónica.

## Alcance

### Incluido

- endurecimiento del `wa-engine`
- sesiones activas/inactivas bajo demanda
- recuperación y coherencia de sesiones
- calibración de reglas de envío
- optimización básica de API
- optimización básica de frontend
- observabilidad mínima
- CI/CD para producción más segura
- soporte base para imágenes con Cloudinary

### Fuera de alcance por ahora

- microservicios
- cambio de provider WA
- colas/eventos distribuidos
- GraphQL
- rediseño total del dominio

---

# Fase 0. Contención inmediata

## Objetivo

Bajar riesgo operativo mientras se ejecuta el refactor.

## Tareas principales

- checklist manual de deploy
- política mínima de backups
- runbooks operativos
- separación clara de `dev` y `prod`
- registro consolidado de incidentes

## Referencias

- [Fase 0: contención operativa](./phase-0-operational-containment.md)
- [Checklist manual de deploy](./deploy-checklist.md)
- [Política mínima de backups](./backups.md)
- [Índice de incidentes](./incidents/README.md)

---

# Fase 1. Blindaje crítico del WA Engine

## Objetivo

Evitar que una sola sesión rota tumbe todo el proceso del worker.

## Problemas que resuelve

- `Execution context was destroyed`
- `Target closed`
- caída completa del `wa-engine`
- pérdida global de clientes en memoria
- un sender fallando arrastrando a los demás

## Tareas

- capturar `unhandledRejection`
- capturar `uncaughtException`
- encapsular errores por sender en `initialize()`
- encapsular errores por sender en `sendMessage()`
- evitar que un error de Puppeteer mate el proceso completo
- mejorar logging por sender
- clasificar errores:
  - navegación inesperada
  - target cerrado
  - auth corrupta
  - timeout
  - no WA
  - QR normal
- aislar limpieza de cliente por sender
- serializar la inicialización de sesiones QR
- evitar inicializaciones concurrentes pesadas

## Criterio de aceptación

- una sesión puede fallar sin tumbar a las demás
- el `wa-engine` deja de reiniciarse por un solo error de Puppeteer
- los logs permiten identificar claramente qué sender falló y por qué

---

# Fase 2. Sesiones activas/inactivas bajo demanda

## Objetivo

Reducir consumo de RAM/CPU activando sesiones solo cuando realmente se usan.

## Problemas que resuelve

- demasiadas sesiones Chromium vivas
- consumo alto de memoria
- consumo alto de CPU
- sesiones conectadas aunque no aporten valor

## Modelo propuesto

- `IDLE`
- `INITIALIZING`
- `WAITING_QR`
- `CONNECTED`
- `SENDING`
- `COOLDOWN`
- `ERROR`

## Tareas

- definir `idle timeout`
- crear lifecycle explícito de sesión
- separar estado en DB de cliente vivo en memoria
- agregar scheduler de apagado por inactividad
- permitir solo X sesiones Chromium simultáneas
- activar sesiones por demanda
- apagar sesiones al terminar de enviar
- limpiar auth local solo cuando corresponda

## Criterio de aceptación

- la RAM baja notablemente cuando no hay campañas activas
- no todos los senders mantienen Chromium vivo
- un sender puede activarse bajo demanda y apagarse al quedar inactivo

---

# Fase 3. Recuperación y consistencia de sesión

## Objetivo

Que el sistema se autocorrija ante estados ambiguos o corruptos.

## Problemas que resuelve

- `state unknown`
- loops de QR
- múltiples `authenticated`
- múltiples `ready`
- sender marcado conectado sin cliente real

## Tareas

- convertir `state unknown` repetido en `DISCONNECTED`
- agregar contador de fallos por sender
- agregar backoff por init fallido
- evitar reinicializaciones simultáneas del mismo sender
- agregar lock por sender
- limpiar cliente huérfano cuando no exista en DB
- reforzar reset real de sesión
- validar eliminación de sender con cascada y limpieza de auth

## Criterio de aceptación

- un sender no queda indefinidamente en limbo
- las sesiones ambiguas se recuperan solas o caen a estado corregible
- los eventos repetidos de QR y ready disminuyen claramente

---

# Fase 4. Calibración anti-bloqueo y ritmo de envío

## Objetivo

Reducir riesgo de bloqueo y hacer el tráfico más humano.

## Problemas que resuelve

- delays demasiado cortos
- tick demasiado agresivo
- falta de warm-up por sender
- falta de pausas largas
- reglas hardcodeadas

## Tareas

- sacar reglas hardcodeadas del `CampaignManager`
- centralizar reglas en configuración editable
- ajustar:
  - `CAMPAIGN_INTERVAL_MS`
  - delays min/max
  - máximos por sender
- agregar warm-up por sender
- agregar pausas largas por volumen
- agregar límites por ventana:
  - 5 min
  - 15 min
  - 30 min
- diferenciar campañas pequeñas, medianas y grandes

## Criterio de aceptación

- baja la tasa de fallos por sesión
- baja la presión sobre Chromium
- el envío se vuelve más progresivo y sostenible

---

# Fase 5. Soporte de imágenes con Cloudinary

## Prioridad

Alta, pero después de blindar engine y sesiones.

## Objetivo

Agregar envío de imágenes sin aumentar demasiado la complejidad operativa del sistema.

## Alcance

- subida de imágenes a Cloudinary
- metadata en DB
- soporte de varias imágenes por campaña o plantilla
- imágenes de un solo uso

## Tareas

- definir modelo de datos para assets de campaña
- integrar subida de imágenes a Cloudinary
- validar formatos y tamaño
- soportar múltiples imágenes por campaña o por plantilla
- marcar imágenes de un solo uso
- definir política post-envío:
  - conservar
  - eliminar
  - archivar metadata
- adaptar worker para enviar media además de texto

## Criterio de aceptación

- una campaña puede incluir imágenes sin romper el flujo actual
- el almacenamiento no depende del VPS
- las imágenes de un solo uso tienen ciclo de vida controlado

---

# Fase 6. Optimización básica de API

## Objetivo

Bajar consumo de CPU y mejorar tiempos de respuesta sin rediseño mayor.

## Tareas

- revisar queries lentas en dashboard, campaigns, senders, messages y reports
- agregar índices faltantes
- reducir joins innecesarios
- revisar eager/lazy loading en SQLAlchemy
- evitar serialización innecesaria
- mover agregados costosos a endpoints específicos
- quitar `--reload` de producción
- agregar healthcheck real de API

## Criterio de aceptación

- menor CPU en uso normal
- tiempos de respuesta más estables
- menos vistas bloqueadas esperando respuesta

---

# Fase 7. Optimización básica de frontend

## Objetivo

Mejorar la percepción de rendimiento y reducir carga innecesaria sobre la API.

## Tareas

- revisar invalidaciones de React Query
- definir `staleTime` razonables
- evitar refetches dobles
- dividir vistas pesadas en queries más pequeñas
- usar loaders por bloque
- cachear metadata y enums
- optimizar tablas grandes
- mejorar feedback de estados de sender y campaña

## Criterio de aceptación

- menos loaders largos
- navegación más fluida
- menos llamadas redundantes a API

---

# Fase 8. Observabilidad mínima

## Objetivo

Entender más rápido qué falla y por qué.

## Tareas

- logs estructurados por:
  - `sender_id`
  - `campaign_id`
  - `session_key`
- métricas mínimas:
  - sesiones activas
  - sesiones en error
  - QR generados
  - init failures
  - mensajes enviados/min
  - memoria y CPU del worker
- resumen operativo interno
- bitácora de incidentes

## Criterio de aceptación

- se puede diagnosticar un incidente con menos tiempo
- se distinguen claramente fallos operativos de fallos de código

---

# Fase 9. CI/CD para estabilidad continua

## Objetivo

Hacer que cada cambio llegue a producción con menos riesgo.

## CI

- lint / typecheck frontend
- build frontend
- build worker
- chequeo sintáctico backend
- validación de migraciones
- validación de `docker compose config`
- smoke tests de rutas críticas
- validación de revision id de Alembic con longitud segura

## CD

- deploy automático solo desde rama controlada
- build frontend antes del deploy
- migraciones automáticas o paso explícito seguro
- rollback simple
- health check post-deploy
- no desplegar si API o worker no están sanos

## Criterio de aceptación

- un deploy roto se detecta antes de tocar prod
- las migraciones fallidas no llegan en silencio
- la estabilidad de producción aumenta con cada iteración

---

## Orden recomendado

1. Fase 0
2. Fase 1
3. Fase 2
4. Fase 3
5. Fase 4
6. Fase 5
7. Fase 6
8. Fase 7
9. Fase 8
10. Fase 9

## Prioridad real

### Crítico

- Fase 1
- Fase 2
- Fase 3

### Alto

- Fase 4
- Fase 5
- Fase 9

### Medio

- Fase 6
- Fase 7
- Fase 8

## Resultado esperado al cerrar este roadmap

- el `wa-engine` deja de caerse por una sola sesión
- las sesiones solo viven cuando aportan valor
- baja el consumo de RAM/CPU del worker
- las campañas se envían con menor agresividad
- la API responde mejor
- el frontend se siente más rápido
- producción se vuelve más segura con CI/CD
- se habilita el envío de imágenes de forma controlada
- la MVP queda estable antes de pensar en una arquitectura más compleja
- Build user management views
- Build admin dashboard
- Allow users to:
  - register and manage WhatsApp sessions (QR scanning)

---

## ⚙️ System Enhancements

- Introduce workspace-based access (initial structure)
- Enforce permissions at backend level
- Improve session assignment per user/workspace

---

## 🚀 Deployment

- Deploy system to cloud environment
- Prepare for multi-user production usage

---

# 🧩 Phase 3 — Scalability & Architecture Evolution

## 🎯 Objective

Evolve system into a **scalable, event-driven architecture**.

---

## ✅ Goals

- Introduce message queue system:
  - RabbitMQ or Apache Kafka
- Decouple components:
  - API
  - Worker
  - WhatsApp Engine

---

## 🏗️ Architecture Improvements

- Implement real-time event processing
- Introduce **workspace-based multi-tenancy**
- Improve:
  - dashboards
  - statistics
  - observability (logs, metrics, tracing)

---

## ⚙️ DevOps

- Implement CI/CD pipelines
- Improve deployment strategy
- Add monitoring and alerting

---

# 🧩 Phase 4 — SaaS Transformation

## 🎯 Objective

Transform the platform into a **SaaS product**.

---

## ✅ Goals

- Multi-tenant architecture (fully isolated workspaces)
- Subscription / billing model
- Public API for clients
- Role-based access at scale
- High availability and horizontal scaling

---

## 🚀 Expected Outcome

A production-ready platform capable of:

- handling multiple clients (workspaces)
- scaling messaging operations
- providing reliable, observable, and controlled message dispatch
