# Opal Clipper — Video Clip Cutter (YouTube tak, 4K tak)

Paste karo link → timestamps do → frame-accurate clips paao. Preview karo, quality chuno (360p se **4K 2160p** tak), single ya bulk ZIP download karo.

**YouTube datacenter-IP block ka permanent solution andar hai** — Cloudflare WARP tunnel (userspace, root ki zaroorat nahi) automatically egress IP badal deta hai, isliye VPS/server par bhi YouTube clips kaat-ne me koi "Sign in to confirm you're not a bot" error nahi aata.

---

## Features

- **Koi bhi video link** — YouTube, plus yt-dlp supported 1000+ sites (Vimeo, Twitter/X, Dailymotion, direct MP4…)
- **Bulk timestamps** — ek saath jitne chaho ranges (`0:45 to 0:52`, `2:31-2:38`, `1:05:10 - 1:05:20`, ya seconds `90-96`). Har timestamp = ek clip card, sab parallel cut hote hain
- **Frame-accurate cutting** — input-seek + `-copyts` + re-encode: exact second pe cut, black-frame/empty output nahi
- **Per-clip preview** — har card me inline player (720p), custom scrub bar
- **Quality select** — source ke hisaab se: 4K · 2160p / 2K · 1440p / 1080p / 720p / 480p / 360p / MP3
- **Bulk download** — multiple clips select → ek ZIP
- **Premium iOS-style UI** — dark, glass, spring animations (Framer Motion)
- **Background jobs** — server-side queue (concurrency 2), browser band kar do, clips ban-te rehte hain; state disk pe persist hoti hai

---

## Requirements (server)

| Cheez | Kyun |
|---|---|
| Linux (Ubuntu 20.04+/Debian/any) | binaries static hain |
| Node.js **20+** | Next.js 16 |
| ffmpeg + ffprobe | clip cutting (setup.sh auto-install kar deta hai apt se) |
| 2 GB RAM, 2 cores | 4K renders ke liye 4 GB RAM better |
| Free ports: **3000** (app), **1080**, **8080**, **9898** (tunnel stack) | sirf localhost pe bind hote hain |
| Internet access | YouTube + GitHub (setup me binaries, agar missing) |

Root ki zaroorat **nahi** hai — sab kuch project folder me userspace chalta hai (ffmpeg apt install ke liye sudo chahiye hoga, agar pehle se nahi hai).

---

## Quick Start (3 commands)

```bash
unzip opal-clipper.zip && cd opal-clipper
bash setup.sh        # deps + binaries + WARP + production build  (~2-4 min)
bash start.sh        # app live on :3000
```

Browser me kholo: `http://YOUR-SERVER-IP:3000`

> Port change karna ho: `PORT=8080 bash start.sh`
> Dev mode (hot reload): `npm run dev` (ya `bun run dev`)

---

## How it works (architecture)

```
 Browser (Next.js UI)
    │  POST /api/analyze {url}
    ▼
 yt-dlp ──(direct try)──► site
    │  blocked? (YouTube datacenter-IP wall)
    ▼
 SOCKS5 :1080 ◄── wireproxy (userspace WireGuard) ──► Cloudflare WARP egress IP
    ▲
 gost :8080 (HTTP bridge) ◄── undici ProxyAgent
    ▲
 media-proxy :9898 (in-process HTTP Range passthrough) ◄── ffmpeg
    │
    ▼  ffmpeg -ss START -to END -copyts -i <video> -i <audio> → re-encode
 Clip files (storage/clips/<id>/preview.mp4, q_2160.mp4, …)
    │
    ▼  /api/render/<id>/file  ·  /api/zip?ids=…
 Download / Bulk ZIP
```

Key points:

1. **Analyze**: yt-dlp pehle direct try karta hai (non-YouTube sites fast), fail hone par WARP tunnel se. Stream URLs IP-locked hote hain, isliye route (direct/tunnel) cache hota hai.
2. **Cut**: ffmpeg direct-URL pe HTTP Range requests maarta hai — poora video download nahi hota, sirf clip ke bytes. Media-proxy range requests ko gost → WARP se forward karta hai.
3. **Render**: preview 720p pe cut hota hai; download aapki chosen quality me fresh render hota hai (frame-accurate).
4. **Self-healing tunnel**: `/api/health` har poll pe tunnel check karta hai — wireproxy/gost down hue to auto-respawn, stuck handshake ho to restart.

### Bundle me kya hai

```
opal-clipper/
├── setup.sh                  # one-shot installer
├── start.sh                  # production start (nohup + health wait)
├── package.json              # minimal deps (14 packages)
├── next.config.ts            # standalone output + serverExternalPackages
├── src/
│   ├── app/                  # UI pages + API routes
│   │   └── api/              # analyze · clips · clip/[id]/preview|poster · render/[id]/file · zip · health · state
│   ├── components/clipper/   # OpalApp, HomeScreen, VideoScreen, QueueScreen, ClipsScreen,
│   │                         # ClipCard, QualitySheet, TabBar, GemHero, BackgroundFX, …
│   └── lib/
│       ├── clipper/          # zustand store, timestamp parser, types
│       └── server/           # ytdlp wrapper · tunnel supervisor · cutter (ffmpeg) ·
│                             # scheduler (queue) · state (persist) · serve (range streams)
├── scripts/
│   ├── yt-dlp                # v2026.08.19 standalone (static, x86_64)
│   ├── wireproxy             # userspace WireGuard client (static)
│   ├── gost                  # HTTP↔SOCKS bridge (static)
│   ├── wgcf                  # WARP account register (naya account banana ho to)
│   ├── warp-tunnel.conf      # pre-registered WARP account (out-of-the-box ready)
│   └── wgcf-account.toml     # account backup
├── public/                   # gem hero art, icons
└── docs/DEVLOG.md            # poori development history
```

---

## API (agar programmatic use karna ho)

| Endpoint | Kaam |
|---|---|
| `POST /api/analyze` `{url}` | video info + available heights |
| `POST /api/clips` `{videoId, ranges:[{start,end}]}` | bulk clips queue |
| `GET /api/state` | videos + clips + renders + tunnel status |
| `GET /api/clip/[id]/preview` | 720p preview (Range-supported) |
| `POST /api/render` `{clipIds, quality}` | quality render start (`"2160"`, `"1080"`, …, `"mp3"`) |
| `GET /api/render/[id]/file` | download rendered file |
| `GET /api/zip?ids=<renderId,renderId>` | bulk ZIP |
| `GET /api/health` | tunnel + proxy health |

---

## Troubleshooting

**`Port 3000 is busy`** → `PORT=3001 bash start.sh` ya `fuser -k 3000/tcp`

**YouTube clip fail + health me `warpOn:false`** → WARP endpoint down hai:
```bash
cd scripts && rm -f wgcf-account.toml wgcf-profile.conf warp-tunnel.conf
./wgcf register --accept-tos && ./wgcf generate
# [Interface]+[Peer] blocks ko warp-tunnel.conf me copy karo, end me ye rakho:
# [Socks5]
# BindAddress = 127.0.0.1:1080
cd .. && bash start.sh
```

**yt-dlp outdated (naye YouTube changes)** → `cd scripts && curl -fsSL -o yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux && chmod +x yt-dlp`

**Non-x86_64 server (ARM)** → `setup.sh` auto-download karega wireproxy/gost/yt-dlp ke arm64 builds

**Systemd unit (auto-restart on reboot)**
```ini
# /etc/systemd/system/opal.service
[Unit]
Description=Opal Clipper
After=network.target

[Service]
Type=simple
User=YOURUSER
WorkingDirectory=/path/to/opal-clipper
ExecStart=/usr/bin/node .next/standalone/server.js
Environment=PORT=3000
Environment=HOSTNAME=0.0.0.0
Restart=always

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl enable --now opal
```

---

## Notes

- Storage sab kuch `./storage/` me — clips delete karne par files bhi clean ho jaati hain (orphan video cache samet)
- Stream URLs ~6 ghante valid — app 3h baad auto-refresh karta hai
- Live streams, private/members-only/age-restricted videos supported nahi hain
- Preview 720p; final render aapki chosen quality me crisp hota hai (CRF 18)
