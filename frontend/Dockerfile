# BookingFlow frontend — Next.js standalone build.
#
# NEXT_PUBLIC_API_BASE_URL is inlined into the client bundle at *build* time
# (Next.js behavior for NEXT_PUBLIC_* variables), not read at container
# startup — the `environment:` entry in the shared docker-compose.yml has no
# effect on the already-built JS. The default below matches .env.example for
# the documented local `docker compose up` setup, where the browser reaches
# the backend via the host's published port. Override with
# `--build-arg NEXT_PUBLIC_API_BASE_URL=...` for a different deployment.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
