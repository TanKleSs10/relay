# Relay API

Relay es un sistema de _message dispatch_ para envíos masivos de WhatsApp con reglas anti-bloqueo y separación clara entre orquestación, ejecución y canal de envío. Este servicio corresponde al componente **API (FastAPI)** del MVP y se enfoca en la orquestación del flujo.

## Alcance del MVP
- Validar la arquitectura general del sistema.
- Demostrar registro de números WhatsApp vía QR.
- Encolar mensajes a partir de CSV.
- Ejecutar envíos en background mediante un worker.
- Aplicar reglas de envío y exponer estado.

Fuera de alcance: autenticación/roles, UI completa, uso productivo continuo, SMS/Email, API pública, multi-tenant y facturación.

## Funcionalidades principales (API)
- Configurar reglas de envío del worker.
- Registrar números emisores y exponer QR de sesión.
- Cargar campañas y mensajes desde CSV con validaciones.
- Estimar capacidad y tiempos en base a reglas y disponibilidad.
- Exponer estado de campañas y del sistema.

## Arquitectura (resumen)
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
Principios clave: la API no envía mensajes, el worker no expone endpoints, el provider no contiene lógica de negocio y la BD es el punto de coordinación.

## Endpoints del MVP (resumen)
- `/health`
- `/senders`
- `/senders/{id}/qr`
- `/worker/rules`
- `/campaigns`
- `/campaigns/{id}/messages/upload`
- `/campaigns/{id}/estimate`
- `/campaigns/{id}/dispatch`
- `/campaigns/{id}/status`

## CSV y mensajes dinámicos
- Columnas mínimas: `phone_number,name,b_reference,…`
- Máximo 20 filas (demo), teléfono no vacío y variables completas.
- Template de mensaje definido en el request (ejemplo):
  `Hola {{name}}, tu saldo es {{balance}}.`

## Estado actual
Este MVP valida flujo operativo y viabilidad técnica. Cualquier escalamiento o extensión requiere una nueva fase formal.
