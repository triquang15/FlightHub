#!/usr/bin/env sh
set -eu

CONFIG_FILE="/usr/share/nginx/html/runtime-config.js"

js_escape() {
  printf "%s" "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cat > "$CONFIG_FILE" <<EOF
window.__FLIGHTHUB_CONFIG__ = {
  VITE_API_BASE_URL: "$(js_escape "${VITE_API_BASE_URL:-http://localhost:8080}")",
  VITE_GOOGLE_CLIENT_ID: "$(js_escape "${VITE_GOOGLE_CLIENT_ID:-}")",
  VITE_FACEBOOK_APP_ID: "$(js_escape "${VITE_FACEBOOK_APP_ID:-}")",
  VITE_GRAFANA_URL: "$(js_escape "${VITE_GRAFANA_URL:-http://localhost:3001}")",
  VITE_PROMETHEUS_URL: "$(js_escape "${VITE_PROMETHEUS_URL:-http://localhost:9090}")",
  VITE_LOKI_URL: "$(js_escape "${VITE_LOKI_URL:-http://localhost:3100}")",
  VITE_ALERTMANAGER_URL: "$(js_escape "${VITE_ALERTMANAGER_URL:-http://localhost:9093}")",
  VITE_ELASTICSEARCH_URL: "$(js_escape "${VITE_ELASTICSEARCH_URL:-http://localhost:9200}")",
  VITE_KIBANA_URL: "$(js_escape "${VITE_KIBANA_URL:-http://localhost:5601}")"
};
EOF

