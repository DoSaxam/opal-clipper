#!/usr/bin/env bash
# ============================================================
#  Opal Clipper — start the production server
#  Usage:  bash start.sh          (default port 3000)
#          PORT=8080 bash start.sh
# ============================================================
cd "$(dirname "$0")"
mkdir -p storage/videos storage/clips

PORT="${PORT:-3000}"
HOST="${HOSTNAME:-0.0.0.0}"

# stop older instance if pidfile exists
if [ -f .opal.pid ]; then
  OLD=$(cat .opal.pid 2>/dev/null)
  if [ -n "$OLD" ] && kill -0 "$OLD" 2>/dev/null; then
    echo "Stopping previous instance (pid $OLD)…"
    kill "$OLD" 2>/dev/null
    sleep 2
  fi
  rm -f .opal.pid
fi

# stale orphan cleanup (same port)
if command -v fuser >/dev/null 2>&1; then fuser -k "$PORT"/tcp 2>/dev/null && sleep 1 || true; fi

echo "Starting Opal Clipper on port $PORT…"
PORT="$PORT" HOSTNAME="$HOST" nohup node .next/standalone/server.js > server.log 2>&1 &
echo $! > .opal.pid

# wait for health
for i in $(seq 1 45); do
  sleep 1
  if curl -sf "http://127.0.0.1:$PORT/api/health" > /dev/null 2>&1; then
    echo ""
    echo "✔ Opal Clipper is LIVE"
    echo "  URL    : http://YOUR-SERVER-IP:$PORT"
    echo "  Health : http://127.0.0.1:$PORT/api/health"
    curl -s "http://127.0.0.1:$PORT/api/health"; echo ""
    exit 0
  fi
done

echo "✘ Server did not become healthy in 45s — last logs:"
tail -20 server.log
exit 1
