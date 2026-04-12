# Relay

Relay is a product‑first WhatsApp campaign dispatcher for teams that need to send
high‑volume messages without losing control of deliverability. It separates
**orchestration (API)**, **execution (worker)**, and **channel (provider)** so you
can scale or swap providers later without rewriting business logic.

## Product goal

Provide a reliable workflow to:
- register WhatsApp senders via QR,
- upload campaigns from CSV,
- dispatch messages safely with basic anti‑ban rules,
- track status end‑to‑end.

## MVP scope
- Sender onboarding via QR (WhatsApp Web).
- Campaign creation and CSV ingestion.
- Background dispatch with rotation and throttling.
- Campaign status tracking and retry.
- Admin/user authentication with basic roles.

Out of scope: multi‑tenant workspaces, billing, public API, SMS/email.

## User flow
1) Admin creates users (ADMIN or USER).
2) Create a campaign.
3) Upload a CSV of recipients and messages.
4) Register sender numbers (QR).
5) Dispatch the campaign.
6) Track status and retry failures if needed.

## Architecture overview
```
Web UI
  ↓
API (FastAPI)
  ↓
PostgreSQL (source of truth)
  ↑
Worker (Node/WhatsApp Web)
  ↓
Provider (whatsapp-web.js)
```

## Screenshots (placeholders)

Add your images here:

- Dashboard image:
  `docs/images/dashboard.png`
- Campaign list image:
  `docs/images/campaigns.png`
- Channel/QR image:
  `docs/images/channels.png`
- Campaign detail image:
  `docs/images/campaign-detail.png`

Example usage:
```
![Dashboard](docs/images/dashboard.png)
```

## Status

The MVP is functional and ready for controlled testing. Current focus:
- access control (roles/permissions),
- session stability and observability,
- minimal CI/CD for cloud deployment.
