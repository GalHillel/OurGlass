"use client";

import { motion } from "framer-motion";

export const LoadingSplash = () => {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[0%] right-[0%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-8">
                {/* Reactor Core Spinner */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                    {/* Outer Rings */}
                    <motion.div
                        className="absolute inset-0 border-2 border-dashed border-blue-500/30 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                        className="absolute inset-2 border-2 border-dotted border-purple-500/30 rounded-full"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Core Pulse */}
                    <motion.div
                        className="absolute inset-8 bg-blue-500/20 rounded-full blur-xl"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Center Icon/Logo placeholder */}
                    <div className="relative z-20 w-16 h-16 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                        <motion.div
                            className="w-8 h-8 rounded-full bg-blue-500"
                            animate={{ scale: [1, 0.8, 1], opacity: [1, 0.7, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                </div>

                {/* Text */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-2"
                >
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        OurGlass
                    </h1>
                    <p className="text-xs text-white/40 tracking-widest uppercase">
                        Initializing Secure Uplink...
                    </p>
                </motion.div>
            </div>
        </div>
    );
};
