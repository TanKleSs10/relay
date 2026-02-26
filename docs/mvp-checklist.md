# MVP checklist (API + views)

## Core flows
- [ ] Create campaign from CSV (UI form -> `POST /campaigns/upload`).
- [ ] List campaigns on panel (`GET /campaigns`).
- [ ] Open campaign detail (`GET /campaigns/{id}`) and render messages.
- [ ] Delete campaign from panel (`DELETE /campaigns/{id}`).
- [ ] Add message manually from detail (`POST /messages`).
- [ ] Delete message from detail (`DELETE /messages/{id}`).

## Endpoint coverage vs UI
- [x] UI edit message uses `PATCH /messages/{id}` but API has no PATCH route.
- [x] UI sends user back to `/panel` after delete, but view route is `/`.
- [ ] UI has "Enviar Mensajes" button with no handler or endpoint yet (blocked until worker).
- [ ] Campaign create UI requires CSV, but API also supports JSON create; confirm if needed for MVP.

## Data/UX gaps worth fixing before worker
- [x] Create campaign should surface `invalid_rows` summary to the user.
- [x] Manage campaign view fetches `/campaigns/{id}` twice; can reuse once.
- [x] Panel JS has unused block that references `campaign` (may throw if executed).

## Quick smoke tests
- [ ] `GET /health` returns ok.
- [ ] `POST /campaigns/upload` with CSV creates messages.
- [ ] `GET /campaigns/{id}` returns messages list.
- [ ] `POST /messages` creates a message tied to campaign.
- [ ] `DELETE /messages/{id}` removes message.
- [ ] `DELETE /campaigns/{id}` removes campaign and messages.
