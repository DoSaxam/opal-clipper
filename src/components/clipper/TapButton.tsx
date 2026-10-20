"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

/** Button with iOS-style press spring. */
export function TapButton({
  children,
  className,
  scale = 0.955,
  ...rest
}: HTMLMotionProps<"button"> & { scale?: number }) {
  return (
    <motion.button
      whileTap={{ scale }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      className={className}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
