import { motion } from "framer-motion";

export function EkgLine({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 120" className={className} preserveAspectRatio="none">
      <defs>
        <linearGradient id="ekg-grad" x1="0" x2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.16 195)" stopOpacity="0" />
          <stop offset="50%" stopColor="oklch(0.78 0.16 195)" />
          <stop offset="100%" stopColor="oklch(0.65 0.20 280)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d="M0 60 L120 60 L140 60 L155 30 L170 90 L185 20 L200 100 L215 60 L350 60 L370 60 L385 40 L400 80 L415 60 L600 60 L620 60 L635 25 L650 95 L665 60 L800 60"
        fill="none"
        stroke="url(#ekg-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
}
