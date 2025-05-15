# Start with a base Node.js image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Patch the @nestjs/schedule module to fix crypto.randomUUID issue
RUN sed -i 's/name = crypto.randomUUID()/name = "interval-" + Date.now().toString(36)/g' \
    /app/node_modules/@nestjs/schedule/dist/scheduler.orchestrator.js

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"] 