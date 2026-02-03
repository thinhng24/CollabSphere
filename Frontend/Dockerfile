# ==================== Build Stage ====================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_URL=http://localhost:5000
ARG VITE_API_BASE_URL=http://localhost:5000/api
ARG VITE_SIGNALR_URL=http://localhost:5000/hubs

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SIGNALR_URL=$VITE_SIGNALR_URL

# Build the application
RUN npm run build

# ==================== Production Stage ====================
FROM nginx:alpine AS production

# Install envsubst for runtime environment variable substitution
RUN apk add --no-cache bash

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy entrypoint script for runtime env substitution
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Start nginx with entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
