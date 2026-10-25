"use client";

import { History, Trash2 } from "lucide-react";
import { useOpal } from "@/lib/clipper/store";
import { fmtBytes, fmtClock, fmtDate } from "@/lib/clipper/types";
import { tierLabel } from "@/lib/clipper/qualities";
import { toast } from "./toast";

/**
 * Browser-local clip history (localStorage only — never sent to any server).
 * LIVE entries can be reopened on the clips screen while the temporary server
 * still holds them.
 */
export function HistoryPanel() {
  const history = useOpal((s) => s.history);
  const clips = useOpal((s) => s.clips);
  const clearHistory = useOpal((s) => s.clearHistory);
  const openVideo = useOpal((s) => s.openVideo);

  if (!history.length) return null;

  return (
    <section className="sect">
      <div className="hhead">
        <History className="lucide sm" style={{ color: "var(--mut)" }} />
        <h2>History</h2>
        <span className="meta one" style={{ margin: 0 }}>
          {history.length} · this browser only
        </span>
        <button
          className="ib"
          style={{ marginLeft: "auto", width: 36, height: 36 }}
          aria-label="Clear history"
          onClick={() => {
            clearHistory();
            toast("History cleared from this browser");
          }}
        >
          <Trash2 className="lucide sm" style={{ color: "var(--mut)" }} />
        </button>
      </div>

      <div className="card" style={{ padding: "6px 16px" }}>
        <div className="hlist">
          {history.slice(0, 12).map((h) => {
            const live = h.status === "live" && clips.some((c) => c.id === h.id);
            return (
              <button
                key={h.id}
                className="hrow"
                onClick={() => {
                  if (live) openVideo(h.videoId, 3);
                  else toast("Expired — the server is temporary");
                }}
              >
                <span className="hthumb">
                  {h.thumbnail ? <img src={h.thumbnail} alt="" loading="lazy" /> : null}
                  <span className="dur">{fmtClock(h.end - h.start)}</span>
                </span>
                <span className="hbody">
                  <b>{h.title || "Video"}</b>
                  <span className="meta">
                    <span className={live ? "pill live" : "pill expired"}>{live ? "LIVE" : "EXPIRED"}</span>
                    <span>
                      {fmtClock(h.start)}–{fmtClock(h.end)}
                    </span>
                    {h.lastQuality ? (
                      <span>
                        {tierLabel(h.lastQuality)} · {fmtBytes(h.lastSizeBytes)}
                        {h.downloadedAt ? ` · ${fmtDate(h.downloadedAt)}` : ""}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
