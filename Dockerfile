# ==============================================================================
# TALENTTRACK ENTERPRISE SAAS — PRODUCTION MULTI-STAGE DOCKERFILE
# Optimized for 100% Free Tier Cloud Deployment (Render, Railway, Fly.io)
# ==============================================================================

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY . .

USER nodejs

EXPOSE 5000

# Automated Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/healthcheck || exit 1

CMD ["node", "server.js"]
