#!/usr/bin/env bash
# ============================================================
#  Opal Clipper — public tunnel
#  Exposes the local app on a public https://*.trycloudflare.com URL.
#
#  Usage:
#    bash scripts/tunnel.sh            # foreground, prints the URL
#    bash scripts/tunnel.sh --daemon   # background, writes scripts/tunnel.url
#
#  The WARP tunnel (wireproxy) is what makes YouTube work from a
#  datacenter IP — this script only puts the app on the public internet.
# ============================================================
set -uo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-3000}"
BIN="scripts/cloudflared"
DAEMON=0
[ "${1:-}" = "--daemon" ] && DAEMON=1

if [ ! -x "$BIN" ]; then
  echo "→ downloading cloudflared…"
  ARCH="$(uname -m)"
  case "$ARCH" in
    x86_64) CF=cloudflared-linux-amd64 ;;
    aarch64|arm64) CF=cloudflared-linux-arm64 ;;
    *) echo "✘ unsupported arch $ARCH — download cloudflared manually → $BIN"; exit 1 ;;
  esac
  curl -fsSL -o "$BIN" "https://github.com/cloudflare/cloudflared/releases/latest/download/$CF" || {
    echo "✘ could not download cloudflared"; exit 1;
  }
  chmod +x "$BIN"
fi

if ! curl -sf "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
  echo "⚠ app is not answering on :$PORT — start it first (bash start.sh)"
fi

if [ "$DAEMON" = "1" ]; then
  rm -f scripts/tunnel.url scripts/tunnel.log
  setsid nohup "$BIN" tunnel --url "http://127.0.0.1:$PORT" --no-autoupdate \
    > scripts/tunnel.log 2>&1 &
  sleep 15
  URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' scripts/tunnel.log | head -1)
  if [ -n "$URL" ]; then
    echo "$URL" > scripts/tunnel.url
    echo "✔ public URL: $URL"
  else
    echo "✘ tunnel did not come up — see scripts/tunnel.log"
    exit 1
  fi
else
  echo "→ public URL will appear below (Ctrl-C to stop)…"
  exec "$BIN" tunnel --url "http://127.0.0.1:$PORT" --no-autoupdate
fi
