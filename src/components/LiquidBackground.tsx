"use client";

/**
 * CSS-only full-viewport background. Static gradient, no animation.
 * Ensures perfect coverage on mobile (100dvh) and desktop.
 */
export const LiquidBackground = () => (
  <div className="fixed inset-0 z-[-10] w-full h-[100dvh] bg-slate-950">
    <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-slate-950/50 to-slate-950 pointer-events-none" />
  </div>
);
