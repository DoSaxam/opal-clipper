# Opal Clipper — Video Clip Cutter (YouTube tak, 4K tak)

Paste karo link → timestamps do → frame-accurate clips paao. Preview karo, quality chuno (360p se **4K 2160p** tak), single ya bulk ZIP download karo — aur app ko phone ke home screen pe install kar lo.

**v2 — full redesign.** UI ab poora shadcn/ui + Framer Motion stack pe hai (fake phone-frame hat gaya, real responsive app shell), aur app **installable PWA** hai: "Add to Home Screen" → fullscreen, offline-capable webapp.

**YouTube datacenter-IP block ka permanent solution andar hai** — Cloudflare WARP tunnel (userspace, root ki zaroorat nahi) automatically egress IP badal deta hai, isliye VPS/server par bhi YouTube clips kaat-ne me koi "Sign in to confirm you're not a bot" error nahi aata.

---

## Features

- **Koi bhi video link** — YouTube, plus yt-dlp supported 1000+ sites (Vimeo, Twitter/X, Dailymotion, direct MP4…)
- **Bulk timestamps** — ek saath jitne chaho ranges (`0:45 to 0:52`, `2:31-2:38`, `1:05:10 - 1:05:20`, ya seconds `90-96`). Har timestamp = ek clip card, sab parallel cut hote hain
- **Frame-accurate cutting** — input-seek + `-copyts` + re-encode, aur output timestamps zero pe rebase (har player par 0:00 se start, koi leading gap nahi)
- **Per-clip preview** — har card me inline player (720p), custom scrub bar, poster frame
- **Quality select** — source ke hisaab se: 4K · 2160p / 2K · 1440p / 1080p / 720p / 480p / 360p / MP3
- **Bulk download** — multiple clips select → ek ZIP
- **Installable PWA** — manifest + service worker + icons; iOS pe "Add to Home Screen" guide sheet, Android/Chromium pe native install prompt
- **Premium Apple-inspired UI** — real app shell (desktop rail + mobile bottom nav), glass surfaces, spring animations (Framer Motion), Lucide icons, dark + light theme
- **Background jobs** — server-side queue (concurrency 2), browser band kar do, clips ban-te rehte hain; state disk pe persist hoti hai
- **Thumbnail proxy** — YouTube thumbnails server se WARP ke through serve hote hain, isliye browser ka blocked egress bhi UI break nahi karta

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
bash setup.sh        # deps + binaries + WARP + icons + production build  (~2-4 min)
bash start.sh        # app live on :3000
```

Browser me kholo: `http://YOUR-SERVER-IP:3000`

> Port change karna ho: `PORT=8080 bash start.sh`
> Dev mode (hot reload): `npm run dev` (ya `bun run dev`)

### Public URL (internet se access)

```bash
bash scripts/tunnel.sh --daemon     # Cloudflare quick tunnel → https://xxx.trycloudflare.com
cat scripts/tunnel.url               # URL yahan
```

Tunnel band karna ho: `pkill -f cloudflared`

---

## Phone pe install (Add to Home Screen)

1. Phone me browser se app kholo (https wala URL best hai)
2. **iPhone (Safari)** → Share button → *Add to Home Screen* (app me bhi ek built-in guide sheet hai)
3. **Android (Chrome)** → menu → *Install app* (app me khud "Add to Home Screen" button aa jayega)
4. Ab app home screen se fullscreen khulega — offline shell cached rehta hai

---

## How it works (architecture)

```
 Browser (Next.js UI  ·  shadcn/ui + Framer Motion)
    │  POST /api/analyze {url}
    ▼
 yt-dlp ──(direct try)──► site
    │  blocked? (YouTube datacenter-IP wall)
    ▼
 wireproxy (userspace WireGuard) ──► Cloudflare WARP egress IP
    │
    ▼
 gost (HTTP proxy) ──► local range-proxy (:9898) ──► ffmpeg
    │
    ▼
 x264/aac re-encode → storage/clips/<id>/{preview.mp4, poster.jpg, q_<quality>.mp4}
```

- **Tunnel stack:** `wireproxy` (SOCKS5, :1080) → `gost` (HTTP bridge, :8080) → in-process media range-proxy (:9898) jo ffmpeg ke liye byte-range fetch karta hai
- **Cutting:** input-side `-ss/-to` + `-copyts` + `setpts/asetpts` rebase → exact second pe cut, zero-based output
- **Render queue:** background scheduler, concurrency 2, state `storage/state.json` me persist
- **Frontend:** App Router + Tailwind v4 + shadcn/ui primitives (Radix) + framer-motion + lucide-react + zustand

### Design system

| Token group | Values |
|---|---|
| Brand | teal `#4fd1c5` → blue `#63b3ed` → violet `#b794f4` gradient |
| Surfaces | dark `#07080a` / `#0d1016` / glass blur 26px · light `#f4f6f9` / `#ffffff` |
| Radius | 14px base → 22/28/32px cards (continuous, Apple-style) |
| Type | system stack (SF Pro on Apple, Segoe on Windows, Roboto on Android) |
| Motion | 150–200ms ease-out, spring press feedback, layout-animated tab pill |

---

## API

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/analyze` | `{url}` → video meta + available heights |
| `POST` | `/api/clips` | `{videoId, ranges:[{start,end}]}` → queued clips |
| `POST` | `/api/render` | `{clipIds:[], quality}` → render jobs |
| `GET` | `/api/clip/:id/preview` | 720p preview (HTTP Range supported) |
| `GET` | `/api/clip/:id/poster` | poster jpg |
| `GET` | `/api/render/:id/file` | rendered file download |
| `GET` | `/api/zip?ids=` | bulk ZIP |
| `GET` | `/api/thumb?v=` | thumbnail proxy (WARP) |
| `POST` | `/api/clips/delete` | `{ids:[]}` |
| `GET` | `/api/state` | full app state (polling) |
| `GET` | `/api/health` | tunnel + service health |

---

## Testing

```bash
bash scripts/e2e-test.sh
```

Real pipeline test karta hai: analyze → cut → preview (206) → poster → render → download → ZIP → delete. 13 checks, har step ka output live aata hai.

---

## Project layout

```
src/
  app/
    api/            analyze · clips · render · zip · state · health · thumb
    globals.css     design tokens (shadcn contract + Opal brand layer)
    layout.tsx      metadata · PWA meta · theme provider
  components/
    ui/             shadcn/ui primitives (button, card, sheet, drawer, tabs, …)
    opal/           AppShell · screens · GemHero · InstallPrompt · Thumb
  lib/
    clipper/        types · zustand store · timestamp parser
    server/         cutter · scheduler · state · tunnel · ytdlp · serve
scripts/
  setup.sh          one-shot install
  start.sh          production start
  tunnel.sh         public URL (Cloudflare quick tunnel)
  e2e-test.sh      end-to-end pipeline test
  make-icons.mjs    PWA icon generation
```

---

## Notes / limits

- 4K render CPU heavy hai — 2-core VPS par 1080p smooth, 4K slow (timeout 7 min tak)
- Stream URLs ~6 ghante valid rehti hain; app 3 ghante pe refresh karta hai, stale (403) pe auto-retry
- HLS-only sources (kuch live streams) precisely cut nahi ho sakte — app clear error dikhata hai
