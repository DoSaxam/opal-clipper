#!/usr/bin/env bash
# ============================================================
#  Opal Clipper — one-shot setup
#  Usage:  bash setup.sh
# ============================================================
set -e
cd "$(dirname "$0")"

BOLD="\033[1m"; GREEN="\033[0;32m"; RED="\033[0;31m"; YELLOW="\033[1;33m"; NC="\033[0m"
step()  { echo -e "\n${BOLD}==> $1${NC}"; }
ok()    { echo -e "${GREEN}✔ $1${NC}"; }
fail()  { echo -e "${RED}✘ $1${NC}"; exit 1; }
warn()  { echo -e "${YELLOW}⚠ $1${NC}"; }

ARCH="$(uname -m)"
OS="$(uname -s)"
[ "$OS" = "Linux" ] || fail "This app targets Linux. On macOS it runs in dev mode only."

step "1/6  Checking system requirements"
# --- Node.js >= 20 ---
if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  [ "$NODE_VER" -ge 20 ] || fail "Node.js >= 20 required (found $(node -v)). Install from https://nodejs.org"
  ok "Node.js $(node -v)"
else
  fail "Node.js not found. Install Node 20+:  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
fi
# --- ffmpeg ---
if command -v ffmpeg >/dev/null 2>&1 && command -v ffprobe >/dev/null 2>&1; then
  ok "ffmpeg $(ffmpeg -version 2>/dev/null | head -1 | awk '{print $3}')"
else
  echo "Installing ffmpeg…"
  if command -v apt-get >/dev/null 2>&1; then sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg
  elif command -v yum >/dev/null 2>&1; then sudo yum install -y ffmpeg || fail "Install ffmpeg manually: https://ffmpeg.org/download.html"
  else fail "Please install ffmpeg manually: https://ffmpeg.org/download.html"
  fi
  command -v ffmpeg >/dev/null 2>&1 || fail "ffmpeg install failed"
  ok "ffmpeg installed"
fi
# --- free ports (3000 app, 1080 wireproxy, 8080 gost, 9898 media-proxy) ---
for P in 3000 1080 8080 9898; do
  if ss -tlnp 2>/dev/null | grep -q ":$P "; then warn "Port $P is busy — make sure it is free before starting the app."; fi
done
ok "Port check done"

step "2/6  Verifying helper binaries (yt-dlp, wireproxy, gost)"
cd scripts
# yt-dlp
./yt-dlp --version >/dev/null 2>&1 || {
  echo "Downloading yt-dlp for $ARCH…"
  if [ "$ARCH" = "x86_64" ] || [ "$ARCH" = "amd64" ]; then
    curl -fsSL -o yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux
  elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
    curl -fsSL -o yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_aarch64
  else fail "Unsupported arch $ARCH — download yt-dlp manually into scripts/"
  fi
  chmod +x yt-dlp
}
ok "yt-dlp $(./yt-dlp --version 2>/dev/null || echo 'installed')"
# wireproxy + gost: bundled for x86_64; download for other arches
if [ "$ARCH" = "x86_64" ] || [ "$ARCH" = "amd64" ]; then
  ./wireproxy --version >/dev/null 2>&1 || true
  ok "wireproxy + gost bundled (x86_64, static)"
else
  warn "Non-x86_64 arch ($ARCH): downloading wireproxy/gost…"
  A2="$([ "$ARCH" = "aarch64" ] && echo arm64 || echo "$ARCH")"
  curl -fsSL -o wireproxy "https://github.com/whyvl/wireproxy/releases/latest/download/wireproxy_linux_${A2}" || fail "Download wireproxy manually → scripts/wireproxy"
  GOST_URL=$(curl -fsSL https://api.github.com/repos/go-gost/gost/releases/latest | grep browser_download_url | grep "linux_${A2}.tar.gz" | cut -d'"' -f4 | head -1)
  [ -n "$GOST_URL" ] && { curl -fsSL -o gost.tgz "$GOST_URL" && tar xzf gost.tgz gost && rm -f gost.tgz; } || warn "Download gost manually → scripts/gost (https://github.com/go-gost/gost/releases)"
  chmod +x wireproxy gost 2>/dev/null || true
fi
cd ..

step "3/6  WARP tunnel account"
if [ -f scripts/warp-tunnel.conf ]; then
  ok "Pre-registered WARP account found (scripts/warp-tunnel.conf) — using it."
  echo "   (Optional: fresh account →  cd scripts && rm -f wgcf-account.toml && ./wgcf register --accept-tos && ./wgcf generate"
  echo "    then copy the [Interface]/[Peer] blocks from wgcf-profile.conf into warp-tunnel.conf"
  echo "    keeping the [Socks5] section:  BindAddress = 127.0.0.1:1080)"
else
  echo "Registering a fresh WARP account…"
  (cd scripts && ./wgcf register --accept-tos && ./wgcf generate)
  python3 - <<'PYEOF'
import re
prof = open("scripts/wgcf-profile.conf").read()
iface_peer = re.search(r"(\[Interface\].*?\[Peer\].*?)(?=^\s*$|\Z)", prof, re.S | re.M)
body = iface_peer.group(1) if iface_peer else prof
conf = body.rstrip() + "\n\n[Socks5]\nBindAddress = 127.0.0.1:1080\n"
open("scripts/warp-tunnel.conf", "w").write(conf)
print("scripts/warp-tunnel.conf written")
PYEOF
  [ -f scripts/warp-tunnel.conf ] || fail "WARP registration failed — check scripts/wgcf-account.toml"
  ok "Fresh WARP account registered"
fi

step "4/6  Installing Node dependencies"
if command -v bun >/dev/null 2>&1; then
  bun install
elif command -v npm >/dev/null 2>&1; then
  npm install --no-audit --no-fund
else
  fail "Neither bun nor npm found. Install Node.js 20+."
fi
ok "Dependencies installed"

step "5/6  Building production bundle"
if command -v bun >/dev/null 2>&1; then bun run build; else npm run build; fi
[ -f .next/standalone/server.js ] || fail "Build did not produce .next/standalone/server.js"
ok "Production build ready"

step "6/6  Preparing storage"
mkdir -p storage/videos storage/clips
ok "Storage ready (./storage)"

echo -e "\n${GREEN}${BOLD}Setup complete!${NC}"
echo "Start the app:   ${BOLD}bash start.sh${NC}"
echo "It will run on:  ${BOLD}http://YOUR-SERVER-IP:3000${NC}"
