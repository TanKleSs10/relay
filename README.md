# Relay Engine

Relay Engine is a WhatsApp campaign orchestration platform designed for teams that need controlled outbound messaging, sender rotation, QR-based onboarding, and operational visibility.

It separates the product into three clear layers:

- `frontend`: campaign and channel management UI
- `backend`: business rules, authentication, campaign ingestion, and media APIs
- `wa-engine`: session lifecycle management and message dispatch through `whatsapp-web.js`

## What it does

- onboard WhatsApp senders through QR
- upload recipient/message batches from CSV
- dispatch campaigns through a background worker
- rotate senders and keep sessions under control
- attach optional images to campaigns
- track campaign and sender state end-to-end

## Why this project is interesting

This project is not just a CRUD app around WhatsApp. It deals with:

- session lifecycle and recovery
- passive vs active runtime cost on small VPS instances
- campaign dispatch orchestration
- anti-ban send rhythm calibration
- media delivery through Cloudinary + WhatsApp
- operational concerns such as migrations, deploys, retries, and observability

## Architecture

```text
React / Vite frontend
        |
        v
FastAPI backend
        |
        v
PostgreSQL
        ^
        |
Node.js WhatsApp worker
        |
        v
whatsapp-web.js / Puppeteer
```

## Core capabilities

### Sender lifecycle
- QR requested, active, and passive QR states
- idle vs connected sender states
- bounded live sessions for small infrastructure
- recovery flows for disconnects and auth failures

### Campaigns
- CSV ingestion
- message deduplication per campaign
- sender rotation
- controlled retry behavior

### Media
- optional campaign images
- Cloudinary-backed asset storage
- one-to-many campaign/media relationship
- WhatsApp send flow with caption on the first image

## Repository layout

```text
service/
  backend/            FastAPI API, Alembic, SQLAlchemy models
  frontend/           React + TypeScript + Vite UI
  workers/whatsapp/   Node.js worker for sessions and dispatch

docs/
  incidents/          Incident index and operational notes
  roadmap.md          Project roadmap
  phase-2-session-lifecycle.md
```

## Local development

### Requirements

- Docker + Docker Compose
- Node.js 20+
- Python 3.12+
- PostgreSQL

### Main environment variables

- `DB_URL`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`

See [.env-template](.env-template) for the current baseline.

### Useful commands

```bash
docker compose up -d
```

Run the local stack with tighter CPU and memory limits to approximate the 4 GB VPS profile:

```bash
docker compose -f docker-compose.dev.yml -f docker-compose.dev-lowmem.yml up -d --build
```

```bash
cd service/backend
alembic upgrade head
```

```bash
cd service/frontend
npm ci
npm run dev
```

```bash
cd service/workers/whatsapp
npm ci
npm run dev
```

## Screenshots

Add product screenshots here when you are ready:

- `docs/images/dashboard.png`
- `docs/images/campaigns.png`
- `docs/images/channels.png`
- `docs/images/campaign-detail.png`
- `docs/images/create-campaign-with-media.png`

Example:

```md
![Dashboard](docs/images/dashboard.png)
```

## Operational status

The current build already includes:

- passive sender lifecycle
- QR on-demand flow
- session recovery hardening
- baseline send rhythm calibration
- optional campaign image support

The next steps are mostly about continued real-world validation, recovery edge cases, and further anti-blocking tuning.

## Notes for reviewers

If you are reviewing this project as a recruiter, collaborator, or client, the most relevant parts are:

- `service/backend/src/domain/models.py`
- `service/workers/whatsapp/src/application/managers/session.manager.ts`
- `service/workers/whatsapp/src/application/managers/campaign.manager.ts`
- `service/workers/whatsapp/src/infrastructure/providers/whatsapp.provider.ts`
- `docs/phase-2-session-lifecycle.md`

These files show the main architectural decisions around reliability, runtime cost control, and campaign execution.
