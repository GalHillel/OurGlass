"use client";

/**
 * CSS-only full-viewport background. Static gradient, no animation.
 * Ensures perfect coverage on mobile (100dvh) and desktop.
 */
export const LiquidBackground = () => (
  <div className="fixed inset-0 z-[-10] w-full h-[100dvh] bg-slate-950">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_70%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(168,85,247,0.15),transparent_70%)]" />
  </div>
);
