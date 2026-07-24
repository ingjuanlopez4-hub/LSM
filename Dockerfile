FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig*.json ./
COPY server ./server
RUN npm run build:api

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production API_HOST=0.0.0.0 API_PORT=3001 DATABASE_PATH=/app/data/manos-mx.db
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist-server ./dist-server
COPY server/migrations ./server/migrations
RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 3001
CMD ["sh", "-c", "node dist-server/scripts/migrate.js && node dist-server/scripts/seed.js && exec node dist-server/index.js"]
