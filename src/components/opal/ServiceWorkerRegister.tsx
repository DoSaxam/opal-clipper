"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker so Opal installs to the home screen and
 * keeps a warm shell offline. Only in production — a SW in dev caches stale
 * modules and breaks hot reload.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* registration failure is non-fatal */
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);
  }, []);

  return null;
}
