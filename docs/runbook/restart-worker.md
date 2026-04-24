# Runbook: reinicio del worker

## Cuándo usarlo

- cuando `wa-engine` cae o reinicia en loop
- cuando el worker deja de procesar
- cuando hay error grave de Puppeteer/Chromium

## Regla

Reiniciar primero solo el worker, no todo el stack.

## Procedimiento

```bash
docker compose restart wa-engine
docker logs relay-wa-engine-1 --tail 200
```

## Verificación

- el contenedor queda en `Up`
- no entra en restart loop
- el worker vuelve a emitir logs normales
- no aparecen errores fatales inmediatamente

## Si sigue fallando

1. revisar logs completos
2. revisar consumo de memoria/CPU
3. revisar si alguna sesión específica está provocando el crash
4. evaluar reset del sender afectado

## No hacer

- no reiniciar DB o API sin motivo
- no borrar auth global
- no usar `down -v`
