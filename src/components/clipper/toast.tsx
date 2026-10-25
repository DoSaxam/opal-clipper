"use client";

import { useEffect, useState } from "react";

let timer: ReturnType<typeof setTimeout> | null = null;
let emit: ((t: string) => void) | null = null;

/** Fire a toast from anywhere (screens, cards, store-adjacent UI). */
export function toast(t: string) {
  emit?.(t);
}

export function ToastHost() {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    emit = (t) => {
      setMsg(t);
      setShow(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setShow(false), 2300);
    };
    return () => {
      emit = null;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!msg) return <div className="toast" role="status" />;

  return (
    <div className={show ? "toast show" : "toast"} role="status">
      {msg}
    </div>
  );
}
