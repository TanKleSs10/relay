# Relay Engine Frontend

This frontend is the operator dashboard for Relay Engine.

It is built with:

- React
- TypeScript
- Vite
- TanStack Query
- React Hook Form
- Zod

## Purpose

The UI is responsible for:

- authentication
- sender onboarding and QR handling
- campaign creation from CSV
- optional media attachment during campaign creation
- campaign monitoring and retry flows

## Main screens

- Login
- Dashboard
- Campaign list
- Create campaign
- Manage channels / QR flow
- Campaign detail and metrics

## Development

Install dependencies:

```bash
npm ci
```

Run locally:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

## API behavior

The frontend expects the API to be available under:

- `VITE_API_BASE_URL`

If it is not provided, production builds fall back to:

- `/api`

This is intended to work cleanly behind the project Nginx setup.

## Screenshots

Add frontend screenshots here when available:

- `../../docs/images/login.png`
- `../../docs/images/dashboard.png`
- `../../docs/images/manage-channels.png`
- `../../docs/images/create-campaign.png`

Example:

```md
![Create Campaign](../../docs/images/create-campaign.png)
```

## Notes

This frontend intentionally stays operational and product-focused rather than overly decorative. Most of the complexity in the project lives in session lifecycle handling, campaign orchestration, and worker/runtime control on the backend side.
