# Multi-stage build: compile then run (smaller final image, no build tools)
FROM node:20-alpine AS builder

# Native addon (better-sqlite3) build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY src tsconfig.json jsconfig.json ./
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine

RUN addgroup -g 1000 app && adduser -u 1000 -G app -D app
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Include app DB from build context (bot.db etc.). Build fails if data/ is missing; create it with: mkdir data
COPY data /app/data

RUN chown -R app:app /app
USER app

# Required at runtime: DISCORD_TOKEN, CLIENT_ID. Optional: GUILD_ID, BOT_DB_PATH
CMD ["node", "dist/index.js"]
