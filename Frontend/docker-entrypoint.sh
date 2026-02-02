#!/bin/bash
set -e

# ==================== Runtime Environment Variable Substitution ====================
# This script replaces environment placeholders in the built JS files at container startup
# This allows us to configure the frontend at runtime rather than build time

echo "Starting CommHub Frontend..."

# Define the directory containing the built files
DIST_DIR="/usr/share/nginx/html"

# Default values for environment variables
: "${VITE_API_URL:=http://localhost:5000}"
: "${VITE_API_BASE_URL:=http://localhost:5000/api}"
: "${VITE_SIGNALR_URL:=http://localhost:5000/hubs}"
: "${VITE_APP_NAME:=CommHub}"

echo "Configuration:"
echo "  API URL: $VITE_API_URL"
echo "  API Base URL: $VITE_API_BASE_URL"
echo "  SignalR URL: $VITE_SIGNALR_URL"
echo "  App Name: $VITE_APP_NAME"

# Create runtime config file that can be loaded by the app
cat > "$DIST_DIR/config.js" << EOF
window.__RUNTIME_CONFIG__ = {
  VITE_API_URL: "${VITE_API_URL}",
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}",
  VITE_SIGNALR_URL: "${VITE_SIGNALR_URL}",
  VITE_APP_NAME: "${VITE_APP_NAME}",
  VITE_ENABLE_NOTIFICATIONS: "${VITE_ENABLE_NOTIFICATIONS:-true}",
  VITE_ENABLE_FILE_UPLOAD: "${VITE_ENABLE_FILE_UPLOAD:-true}",
  VITE_MAX_FILE_SIZE: "${VITE_MAX_FILE_SIZE:-52428800}"
};
EOF

echo "Runtime configuration written to $DIST_DIR/config.js"

# If environment variables contain placeholders from build time, replace them
# This handles cases where the build was done with placeholder values
if [ -d "$DIST_DIR/assets" ]; then
    echo "Replacing environment placeholders in built assets..."

    # Find all JS files and replace placeholder URLs
    find "$DIST_DIR/assets" -name "*.js" -type f | while read -r file; do
        # Replace common placeholder patterns
        sed -i "s|__VITE_API_URL__|${VITE_API_URL}|g" "$file"
        sed -i "s|__VITE_API_BASE_URL__|${VITE_API_BASE_URL}|g" "$file"
        sed -i "s|__VITE_SIGNALR_URL__|${VITE_SIGNALR_URL}|g" "$file"

        # Replace localhost:5000 with actual API URL if different
        if [ "$VITE_API_URL" != "http://localhost:5000" ]; then
            sed -i "s|http://localhost:5000|${VITE_API_URL}|g" "$file"
        fi
    done

    echo "Placeholder replacement complete"
fi

# Update nginx config if backend host is specified
if [ -n "$BACKEND_HOST" ]; then
    echo "Updating nginx backend host to: $BACKEND_HOST"
    sed -i "s|http://api-gateway:5000|http://${BACKEND_HOST}|g" /etc/nginx/nginx.conf
fi

# Verify nginx configuration
echo "Verifying nginx configuration..."
nginx -t

echo "Starting nginx..."

# Execute the CMD
exec "$@"
