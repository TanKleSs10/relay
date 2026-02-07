# Repository Guidelines

## Project Structure & Module Organization
- `src/main.py` bootstraps the FastAPI app and mounts static assets and templates.
- API routes live in `src/api/routes/` (health checks in `health.py`, HTML view in `view.py`, shared deps in `deps.py`).
- Database wiring is in `src/infrastructure/db/` (`session.py` creates the SQLAlchemy engine and session).
- HTML templates are in `src/templates/` and static assets in `src/statics/` (CSS/JS).

## Build, Test, and Development Commands
- `pip install -r requirements.txt` installs runtime dependencies.
- `uvicorn src.main:app --reload` runs the API locally with auto-reload.
- `docker build -f Dockerfile.api -t relay-api .` builds the container image.
- `docker run -p 8000:8000 --env DB_URL=... relay-api` runs the container.

## Coding Style & Naming Conventions
- Python follows standard PEP 8 conventions (4-space indentation, snake_case for functions/vars).
- Keep route modules small and focused (`health.py`, `view.py`) and add shared dependencies to `deps.py`.
- Prefer explicit module names that match their responsibility (e.g., `session.py` for DB session setup).

## Testing Guidelines
- No automated test suite is present yet. If you add tests, place them in a top-level `tests/` directory and name files `test_*.py`.
- Suggested tooling: `pytest` with FastAPI’s `TestClient` for API routes.

## Commit & Pull Request Guidelines
- This repository has no commit history yet, so no established commit-message convention exists.
- For PRs, include a short summary, linked issue (if any), and any required env/config changes (like `DB_URL`).

## Security & Configuration Tips
- The service requires `DB_URL` at startup; set it in your environment or Docker run command.
- Avoid checking secrets into the repo; use `.env` locally and `.gitignore` it if added.
