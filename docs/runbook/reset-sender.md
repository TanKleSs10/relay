# Runbook: reset de sender

## Cuándo usarlo

- cuando un sender no responde
- cuando la sesión quedó corrupta
- cuando se requiere QR nuevo
- cuando el sender quedó en estado inconsistente

## Objetivo

Destruir la sesión anterior y forzar la creación de una nueva.

## Flujo esperado

1. limpiar cliente en memoria
2. limpiar auth local asociado
3. regenerar `session_key`
4. dejar el sender listo para generar QR nuevo

## Verificación

Después del reset:

- el sender no debe reutilizar la sesión anterior
- debe generarse QR nuevo
- el worker no debe caer
- el sender debe pasar por `WAITING_QR` o `INITIALIZING`

## Si falla

1. revisar logs del `wa-engine`
2. revisar si el auth local fue realmente borrado
3. revisar si el sender volvió con el mismo `session_key`
4. revisar estado del sender en DB

## No hacer

- no reiniciar todo el stack como primer paso
- no borrar volúmenes completos para resetear un sender
- no usar `down -v`
