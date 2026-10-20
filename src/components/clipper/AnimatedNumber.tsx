"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useTransform, motion } from "framer-motion";

/** Spring-animated number counter (iOS-style). */
export function AnimatedNumber({
  value,
  className,
  style,
}: {
  value: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 90, damping: 20, mass: 0.9 });
  const display = useTransform(spring, (v) => String(Math.round(v)));

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      mv.set(value);
      first.current = false;
    } else {
      mv.set(value);
    }
  }, [value, mv]);

  return (
    <motion.span className={className} style={style}>
      {display}
    </motion.span>
  );
}
