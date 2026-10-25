import type { Variants } from "framer-motion";

/** Stagger container — children rise + fade in one by one (Opal Clipper motion spec). */
export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

/** Child item — rises 22px, 0.45s, signature ease. */
export const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.2, 0.9, 0.3, 1] } },
};

/** Dock entrance — slides up 24px with a slight delay. */
export const dockIn: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.15 } },
};

/** Screen swap (used by the shell's AnimatePresence). */
export const screenIn: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } },
};
