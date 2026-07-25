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
- `docker compose up --build`: demo local en contenedor; Compose fuerza deliberadamente `NODE_ENV=development`.
- `GET /docs` y `GET /openapi.json`: documentación del contrato.

## Identidad y seguridad

El modo actual resuelve **Andrea M.** en el servidor (`demo-andrea`) y no acepta IDs de usuario del cliente. Es un límite deliberado: antes de producción se debe reemplazar el middleware de identidad en `server/app.ts` por autenticación real y autorización por recurso. El servidor se niega siempre a iniciar en `NODE_ENV=production` mientras solo exista auth demo; no hay variable de bypass.

CORS usa una allowlist, el JSON está limitado a 32 KiB, se aplican headers de seguridad, rate limiting en memoria y logs JSON sin cuerpos ni datos sensibles. Para múltiples réplicas, el rate limiter debe moverse a un almacén compartido.

No se usan cookies ni credenciales de navegador, por lo que el modo demo actual no tiene una sesión susceptible a CSRF. CORS reduce solicitudes desde orígenes de navegador no permitidos, pero no sustituye autenticación ni autorización y clientes no navegador pueden omitir `Origin`.

## Persistencia

El esquema reproducible vive en `server/migrations/`; por defecto la base está en `data/manos-mx.db`. SQLite usa claves foráneas, WAL, `busy_timeout` y transacciones `BEGIN IMMEDIATE` para adjudicación de puntos y cupos. Haz respaldo del archivo antes de migraciones futuras; las migraciones aplicadas quedan registradas en `schema_migrations`.

El archivo local no es durable ni compartido en Vercel Functions. Consulta `DEPLOYMENT.md`: el despliegue Vercel admitido es exclusivamente el frontend estático.
