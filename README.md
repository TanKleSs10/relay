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

Out of scope: authentication/roles, multi‑tenant, billing, public API, SMS/email.

## User flow
1) Create a campaign.
2) Upload a CSV of recipients and messages.
3) Register sender numbers (QR).
4) Dispatch the campaign.
5) Track status and retry failures if needed.

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

The MVP is functional and ready for controlled testing. The next phase is
hardening (observability, retries, compliance) and scaling throughput.
