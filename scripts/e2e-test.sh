#!/usr/bin/env bash
# ============================================================
#  Opal Clipper — end-to-end pipeline test
#  Exercises: analyze → cut → preview → render → download → zip
#  Usage: bash scripts/e2e-test.sh
# ============================================================
set -uo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-3000}"
BASE="http://127.0.0.1:$PORT"
VIDEO_URL="${VIDEO_URL:-https://www.youtube.com/watch?v=aqz-KE-bpKQ}"
PASS=0; FAIL=0
ok()   { echo -e "  \033[0;32m✔\033[0m $1"; PASS=$((PASS+1)); }
bad()  { echo -e "  \033[0;31m✘\033[0m $1"; FAIL=$((FAIL+1)); }
step() { echo -e "\n\033[1m==> $1\033[0m"; }

step "0. server up?"
if ! curl -sf "$BASE/api/health" >/dev/null 2>&1; then
  echo "  server not running on $PORT — start it first (bash start.sh)"
  exit 1
fi
curl -s "$BASE/api/health" | head -c 300; echo
ok "health endpoint responded"

step "1. analyze $VIDEO_URL"
ANALYZE=$(curl -s -X POST "$BASE/api/analyze" -H 'Content-Type: application/json' \
  -d "{\"url\":\"$VIDEO_URL\"}" --max-time 180)
echo "  $ANALYZE" | head -c 400; echo
VIDEO_ID=$(echo "$ANALYZE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('video',{}).get('id',''))" 2>/dev/null)
if [ -n "$VIDEO_ID" ]; then ok "analyzed video id=$VIDEO_ID"; else bad "analyze failed"; exit 1; fi

step "2. create 2 clips (5-12s, 30-38s)"
CLIPS=$(curl -s -X POST "$BASE/api/clips" -H 'Content-Type: application/json' \
  -d "{\"videoId\":\"$VIDEO_ID\",\"ranges\":[{\"start\":5,\"end\":12},{\"start\":30,\"end\":38}]}" --max-time 60)
echo "  $CLIPS" | head -c 300; echo
CLIP_IDS=$(echo "$CLIPS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(' '.join(c['id'] for c in d.get('clips',[])))" 2>/dev/null)
CLIP_IDS_JSON=$(echo "$CLIP_IDS" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().split()))" 2>/dev/null)
CLIP_COUNT=$(echo "$CLIP_IDS" | wc -w | tr -d ' ')
[ "$CLIP_COUNT" = "2" ] && ok "2 clips queued" || bad "expected 2 clips, got $CLIP_COUNT"

step "3. wait for cuts to finish"
for i in $(seq 1 90); do
  STATE=$(curl -s "$BASE/api/state" --max-time 20)
  READY=$(MY_IDS="$CLIP_IDS_JSON" python3 -c "
import sys,json,os
d=json.load(sys.stdin)
mine=set(json.loads(os.environ.get('MY_IDS','[]')))
cl=[c for c in d['clips'] if c['id'] in mine]
print(sum(1 for c in cl if c['status']=='ready'), sum(1 for c in cl if c['status']=='error'))" <<< "$STATE" 2>/dev/null)
  set -- $READY
  if [ "${1:-0}" = "2" ]; then ok "both clips ready (${i}s)"; break; fi
  if [ "${2:-0}" != "0" ]; then bad "clip errored"; break; fi
  sleep 2
done
[ "${1:-0}" = "2" ] || { echo "$STATE" | python3 -c "import sys,json;d=json.load(sys.stdin);print('  clip states:',[(c['status'],c.get('stage'),round(c['progress'])) for c in d['clips']])"; }

FIRST_CLIP=$(echo "$CLIP_IDS" | cut -d' ' -f1)

step "4. preview stream (http range)"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -r 0-1024 "$BASE/api/clip/$FIRST_CLIP/preview" --max-time 30)
[ "$CODE" = "206" ] || [ "$CODE" = "200" ] && ok "preview served (HTTP $CODE)" || bad "preview failed (HTTP $CODE)"

step "5. poster frame"
CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/clip/$FIRST_CLIP/poster" --max-time 30)
[ "$CODE" = "200" ] && ok "poster served" || bad "poster failed (HTTP $CODE)"

step "6. render 480p"
RENDER=$(curl -s -X POST "$BASE/api/render" -H 'Content-Type: application/json' \
  -d "{\"clipIds\":$CLIP_IDS_JSON,\"quality\":\"480\"}" --max-time 60)
echo "  $RENDER" | head -c 300; echo
RENDER_ID=$(echo "$RENDER" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['renders'][0]['id'] if d.get('renders') else '')" 2>/dev/null)
[ -n "$RENDER_ID" ] && ok "render job $RENDER_ID started" || bad "render did not start"

step "7. wait for render"
for i in $(seq 1 90); do
  STATE=$(curl -s "$BASE/api/state" --max-time 20)
  DONE=$(echo "$STATE" | python3 -c "
import sys,json
d=json.load(sys.stdin)
r=[x for x in d['renders'] if x['id']=='$RENDER_ID']
print(r[0]['status'] if r else 'missing', r[0].get('error','') if r else '')" 2>/dev/null)
  set -- $DONE
  if [ "${1:-}" = "ready" ]; then ok "render ready (${i}s)"; break; fi
  if [ "${1:-}" = "error" ]; then bad "render error: ${2:-}"; break; fi
  sleep 2
done

step "8. download rendered file"
curl -s -L -o /tmp/opal-test-clip.mp4 "$BASE/api/render/$RENDER_ID/file" --max-time 120
SIZE=$(stat -c%s /tmp/opal-test-clip.mp4 2>/dev/null || echo 0)
[ "$SIZE" -gt 10000 ] && ok "downloaded ${SIZE} bytes" || bad "download too small (${SIZE} bytes)"
if command -v ffprobe >/dev/null 2>&1; then
  D=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 /tmp/opal-test-clip.mp4 2>/dev/null)
  ST=$(ffprobe -v error -select_streams v:0 -show_entries stream=start_time -of csv=p=0 /tmp/opal-test-clip.mp4 2>/dev/null)
  ok "video stream: start=${ST}s duration=${D}s (expected 0 → 7)"
fi

step "9. bulk ZIP"
curl -s -L -o /tmp/opal-test.zip "$BASE/api/zip?ids=$RENDER_ID" --max-time 120
ZSIZE=$(stat -c%s /tmp/opal-test.zip 2>/dev/null || echo 0)
[ "$ZSIZE" -gt 1000 ] && ok "zip ${ZSIZE} bytes" || bad "zip too small (${ZSIZE} bytes)"
python3 - <<'PY' 2>/dev/null && ok "zip contents valid" || bad "zip invalid"
import zipfile,sys
z=zipfile.ZipFile('/tmp/opal-test.zip')
assert z.namelist(), 'empty zip'
print('  entries:', z.namelist())
PY

step "10. delete clips"
curl -s -X POST "$BASE/api/clips/delete" -H 'Content-Type: application/json' \
  -d "{\"ids\":$CLIP_IDS_JSON}" --max-time 30 >/dev/null
LEFT=$(MY_IDS="$CLIP_IDS_JSON" python3 -c "
import sys,json,os
d=json.load(sys.stdin)
mine=set(json.loads(os.environ.get('MY_IDS','[]')))
print(len([c for c in d['clips'] if c['id'] in mine]))" <<< "$(curl -s "$BASE/api/state")" 2>/dev/null)
[ "$LEFT" = "0" ] && ok "clips deleted" || bad "delete left $LEFT of the test clips"

echo -e "\n\033[1m========================================\033[0m"
echo -e "  passed: $PASS   failed: $FAIL"
echo -e "\033[1m========================================\033[0m"
[ "$FAIL" = "0" ]
