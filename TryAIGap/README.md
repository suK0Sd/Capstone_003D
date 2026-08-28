# TryAIGap — Monorepo

Plataforma de AI Assessment (diagnóstico de madurez en IA). Marca: **tryAIGap** — "Bridge the AI Gap"
(magenta `#C9359F` → teal `#14B8A6`).

## Estructura

```
backend/    FastAPI + SQLAlchemy async + PostgreSQL (prod) / SQLite (dev local)
web/        React + TypeScript + Vite + Tailwind + shadcn/ui (puerto 5173)
mobile/     (diferido) App Flutter — solo rol cliente. Requiere instalar Flutter SDK.
wireframe-v2.html   Wireframe interactivo de referencia (ya rebrandeado a tryAIGap)
Spanish/, English/  Kits Excel fuente de los cuestionarios (sembrados en la BD)
```

## Backend (`backend/`)

```bat
cd backend
.venv\Scripts\python -m uvicorn app.main:app --port 8000
```

- API en `http://localhost:8000/api/v1` · docs en `/docs` · health en `/health`.
- Dev usa SQLite (`dev.db`) vía `dev_settings.txt`; prod usa PostgreSQL (`DATABASE_URL`, Alembic en `migrations/`).
- Resembrar preguntas (madurez + 7 áreas × 16, ES/EN desde los Excel): `.venv\Scripts\python -m app.seed`
- Integraciones dev sin claves: email → consola de uvicorn, storage → `./_storage`, Stripe → checkout simulado.

### Auth en desarrollo (magic link)

1. `POST /api/v1/auth/magic-link` con `{"email":"dev@yourcompany.com","locale":"es"}`
2. Copia el `token=` del enlace impreso en la consola de uvicorn (fallback de email)
3. `POST /api/v1/auth/verify` con `{"token":"..."}` → `access_token` + `refresh_token`
4. En la web, el enlace apunta a `http://localhost:5173/auth/verify?token=...`

## Web (`web/`)

```bat
cd web
npm.cmd run dev     :: http://localhost:5173
npm.cmd run build   :: build producción (tsc + vite)
npm.cmd run test    :: Vitest (unitarios)
npm.cmd run lint
```

- `VITE_API_URL` en `web/.env` (default `http://localhost:8000/api/v1`).
- 4 idiomas (es/en/de/pt), tema claro/oscuro, catálogo de componentes en `/catalog` (público).
- Roles: `client`, `consultant` (consola `/consultant`), `admin`.
  Para probar consultor en dev: `UPDATE users SET role='consultant' WHERE email='...'` en `backend/dev.db` y re-login.
- Pagos: Stripe simulado — la web detecta `checkout_url` mock y enruta a `/payment/checkout`.
- Informe PDF: generado en cliente (`@react-pdf/renderer`, lazy-loaded en `/results`).

## Estado y deuda técnica conocida

Ver `HANDOFF-PHASE3.md` (gaps de API: aceptación de invitaciones, listado de reviews, historial de notas de consultor,
cap de upload 25 MB en dev vs 1 GB de spec, heatmap/prioridades con datos de muestra en backend).
