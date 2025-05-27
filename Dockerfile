# ----------------------------
# 1) Builder stage
# ----------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# 1.1 Copy package files first
COPY package*.json ./

# 1.2 Install dependencies without running scripts to avoid build issues
RUN npm ci --ignore-scripts

# 1.3 Copy source code and static files
COPY . .

# 1.4 Generate types and Prisma client, then build application
RUN npm run generate-types
RUN npx prisma generate
RUN npm run tsc

# ----------------------------
# 2) Production stage
# ----------------------------
FROM node:22-alpine AS production
WORKDIR /app

# 2.1 Create nodejs user first
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# 2.2 Copy only the built artifacts + prod deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/static ./static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 2.3 Prune away dev-only deps
RUN npm prune --omit=dev \
# 2.4 Change ownership and switch to non-root user
&& chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000
CMD ["npm", "start"]
  