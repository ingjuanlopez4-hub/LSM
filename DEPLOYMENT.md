# Despliegue en Vercel

## Arquitectura soportada actualmente

El despliegue soportado en Vercel es **solo el frontend estático de Vite**. `vercel.json` publica `dist`, aplica headers de seguridad y reescribe rutas de la SPA a `index.html`. El guard `npm run verify:vercel` falla si aparecen directorios `api/` o `functions/`, si se cambia el destino estático o si se intenta configurar `VITE_API_URL`.

El backend de `server/` **no está listo ni se despliega en Vercel**:

- usa una identidad demo fija, sin autenticación ni autorización reales;
- usa `node:sqlite` sobre un archivo local, que no es persistencia durable ni compartida en Vercel Functions;
- limita solicitudes en memoria, por lo que el límite no se comparte entre réplicas;
- sus transacciones y controles de concurrencia suponen una base SQLite compartida por un proceso/host durable.

No se debe crear un entrypoint bajo `api/`, incluir `server/` como Function ni activar la identidad demo en producción. Antes de desplegar el backend se requiere una decisión explícita sobre autenticación, autorización por recurso, base de datos gestionada con migración transaccional y rate limiting compartido. Este repositorio no elige proveedor ni credenciales.

## Configuración de Vercel

- Runtime de build: Node.js 22 (el proyecto exige `>=22.13.0`).
- Build command: definido por `vercel.json` como `npm run build:vercel`.
- Output: `dist`.
- Variables: ninguna para el frontend actual. En particular, no definas `VITE_API_URL`.

La CSP permite únicamente los scripts y estilos compilados del mismo origen, las hojas de Google Fonts, las fuentes de `fonts.gstatic.com` y las imágenes existentes de `images.unsplash.com`. Si se agregan recursos externos, hay que revisar la CSP deliberadamente; no se debe resolver con comodines.

`Strict-Transport-Security` obliga HTTPS durante un año. No se incluyen `includeSubDomains` ni `preload` hasta que el dominio definitivo y todos sus subdominios se auditen expresamente.

## Verificación reproducible

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run security:secrets
npm run build:vercel
npm audit --omit=dev
npm audit
```

La API puede seguir usándose localmente según `BACKEND.md`; su guard rechaza siempre `NODE_ENV=production` mientras `AUTH_MODE=demo` sea la única modalidad.
