# Backend Manos MX

API REST TypeScript/Express con SQLite local (`node:sqlite`). La aplicación aplica migraciones al arrancar; el seed es explícito e idempotente. Todas las respuestas exitosas usan `{ "data": ... }` (y `meta` para paginación) y los errores `{ "error": { "code", "message", "details?" }, "requestId" }`.

## Inicio local

```bash
cp .env.example .env
npm run db:setup
npm run dev:api       # http://127.0.0.1:3001
```

- `npm run dev:all`: frontend y API.
- `npm run test`: pruebas aisladas con SQLite en memoria.
- `npm run build:api && npm run start:api`: build/servidor compilado.
- `GET /docs` y `GET /openapi.json`: documentación del contrato.

## Identidad y seguridad

El modo actual resuelve **Andrea M.** en el servidor (`demo-andrea`) y no acepta IDs de usuario del cliente. Es un límite deliberado: antes de producción se debe reemplazar el middleware de identidad en `server/app.ts` por autenticación real y autorización por recurso. El servidor se niega a iniciar en `NODE_ENV=production` con auth demo, salvo aceptación explícita mediante `ALLOW_DEMO_AUTH_IN_PRODUCTION=true`.

CORS usa una allowlist, el JSON está limitado a 32 KiB, se aplican headers de seguridad, rate limiting en memoria y logs JSON sin cuerpos ni datos sensibles. Para múltiples réplicas, el rate limiter debe moverse a un almacén compartido.

## Persistencia

El esquema reproducible vive en `server/migrations/`; por defecto la base está en `data/manos-mx.db`. SQLite usa claves foráneas, WAL, `busy_timeout` y transacciones `BEGIN IMMEDIATE` para adjudicación de puntos y cupos. Haz respaldo del archivo antes de migraciones futuras; las migraciones aplicadas quedan registradas en `schema_migrations`.
