"use client";

import { motion } from "framer-motion";

export const HomeMosaicSkeleton = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-3 w-full max-w-md px-4 perspective-1000 animate-pulse mt-[72px] mb-24"
        >
            {/* Row 1: Reactor Core Skeleton (Full width) */}
            <div className="col-span-2 mb-2">
                <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 h-48 overflow-hidden relative">
                    <div className="absolute inset-0 bg-white/5" />
                    <div className="w-full flex items-center justify-between p-6 h-full flex-col">
                        <div className="w-24 h-4 bg-white/10 rounded-full" />
                        <div className="w-48 h-10 bg-white/10 rounded-full mt-4" />
                        <div className="w-32 h-4 bg-white/10 rounded-full mt-2" />
                    </div>
                </div>
            </div>

            {/* Row 2: AI Hub Banner Skeleton (Full width) */}
            <div className="col-span-2">
                <div className="bg-indigo-900/20 backdrop-blur-md border border-indigo-500/10 rounded-[2rem] p-5 h-20" />
            </div>

            {/* Row 3: Two Square Tiles */}
            <div className="aspect-[4/3] bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl" />
            <div className="aspect-[4/3] bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl" />

            {/* Row 4: Two Square Tiles */}
            <div className="aspect-[4/3] bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl" />
            <div className="aspect-[4/3] bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl" />

            {/* Row 6 & 7: Wide Buttons */}
            <div className="col-span-2 bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl h-20 mt-3" />
            <div className="col-span-2 bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl h-20" />
        </motion.div>
    );
};
