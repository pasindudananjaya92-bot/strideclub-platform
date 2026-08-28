# Multi-stage Dockerfile for STRIDECLUB
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy application source code
COPY . .

# Build Vite client and backend bundle into /dist
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

# Expose standard web port
EXPOSE 3000

# Run the compiled CommonJS server
CMD ["node", "dist/server.cjs"]
