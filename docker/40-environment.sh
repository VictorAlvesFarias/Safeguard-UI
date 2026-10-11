#!/bin/sh
# The app imports /environment.js at runtime (vite.config.js keeps the environment module out of
# the bundle), so the API address comes from the container instead of being baked into the build.
set -eu

cat > /usr/share/nginx/html/environment.js <<JS
export const env = "${API_URL:-http://localhost:5001}";
JS

echo "environment.js: API_URL=${API_URL:-http://localhost:5001}"
