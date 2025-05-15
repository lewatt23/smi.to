

FROM node:18-alpine AS base
WORKDIR /app


FROM base AS deps

RUN apk add --no-cache libc6-compat


COPY package.json package-lock.json* ./


RUN npm ci --legacy-peer-deps

# ---- Builder ----
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .


ENV NODE_ENV production

# Build the Next.js application
RUN npm run build

# ---- Runner ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

ENV NEXT_TELEMETRY_DISABLED 1



COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000


CMD ["node", "server.js"]