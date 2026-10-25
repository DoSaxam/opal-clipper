"use client";

import { useEffect, useState } from "react";
import { useMotionValue, useSpring } from "framer-motion";

/** Spring-animated number (used for the big cutting percentage). */
export function Counter({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 120, damping: 24 });
  const [text, setText] = useState(Math.round(value));

  useEffect(() => {
    mv.set(value);
  }, [value, mv]);

  useEffect(() => spring.on("change", (v) => setText(Math.round(v))), [spring]);

  return <span className={className}>{text}</span>;
}
