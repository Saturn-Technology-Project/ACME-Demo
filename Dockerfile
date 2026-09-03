FROM node:22-alpine AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
RUN mkdir -p public
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend ./
COPY --from=frontend /frontend/out ./public

ENV NODE_ENV=production
ENV PORT=4000
ENV PUBLIC_DIR=/app/public
ENV SQLITE_PATH=/app/data/acme.sqlite
ENV NODE_OPTIONS=--experimental-sqlite
EXPOSE 4000

CMD ["npx", "tsx", "src/index.ts"]
