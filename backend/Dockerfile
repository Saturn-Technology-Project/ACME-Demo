FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
ENV PORT=4000
ENV SQLITE_PATH=/app/data/acme.sqlite
ENV NODE_OPTIONS=--experimental-sqlite
EXPOSE 4000
CMD ["npx", "tsx", "src/index.ts"]
