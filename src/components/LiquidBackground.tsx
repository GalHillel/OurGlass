"use client";

import { motion } from "framer-motion";

export const LiquidBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-500/30 blur-[100px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          rotate: [0, -60, 0],
          x: [0, -100, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-teal-500/30 blur-[100px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 45, 0],
          x: [0, 50, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-pink-500/30 blur-[100px]"
      />
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
    </div>
  );
};
