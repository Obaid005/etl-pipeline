# Build Stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy remaining source
COPY . .

# Patch the @nestjs/schedule module to fix crypto.randomUUID issue
RUN sed -i 's/name = crypto.randomUUID()/name = "interval-" + Date.now().toString(36)/g' \
    /app/node_modules/@nestjs/schedule/dist/scheduler.orchestrator.js

# Build the application
RUN npm run build

# Production Stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create app directory 
RUN mkdir -p /app/data

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production

# Patch the @nestjs/schedule module to fix crypto.randomUUID issue
RUN sed -i 's/name = crypto.randomUUID()/name = "interval-" + Date.now().toString(36)/g' \
    /app/node_modules/@nestjs/schedule/dist/scheduler.orchestrator.js

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/webpack-config.js ./webpack-config.js

# Set environment variables
ENV NODE_ENV=production
ENV TZ=UTC

# Install netcat for health checks
RUN apk add --no-cache netcat-openbsd

# Create a health check script
COPY ./scripts/healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

# Set up the health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD ["healthcheck.sh"]

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"] 