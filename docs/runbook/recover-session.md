# Runbook: recuperación de sesión

## Síntomas típicos

- `state unknown; skipping transition`
- QR repetidos
- múltiples `authenticated`
- múltiples `ready`
- sender en `CONNECTED` sin cliente real

## Objetivo

Llevar una sesión ambigua a un estado recuperable sin tumbar todo el sistema.

## Procedimiento base

1. Revisar logs del worker:

   ```bash
   docker logs relay-wa-engine-1 --tail 200
   ```

2. Identificar sender afectado.
3. Verificar estado en DB.
4. Si el sender está inconsistente:
   - mover a `DISCONNECTED`
   - o usar reset de sesión
5. Si requiere QR:
   - validar que el QR se regenere

## Cuándo escalar

- si el worker cae completo
- si varios senders entran en `state unknown`
- si se repiten `Execution context was destroyed`
- si hay loops de QR

## Verificación

- sender vuelve a un estado coherente
- worker sigue arriba
- no aparecen más eventos duplicados del mismo sender
