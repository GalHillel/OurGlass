"use client";

import { motion } from "framer-motion";
import { Goal } from "@/types";
import { Building2, Landmark, Wallet } from "lucide-react";

export const AssetTowers = ({ assets }: { assets: Goal[] }) => {
    // Find max value for scaling
    const maxValue = Math.max(...assets.map(a => a.current_amount), 1);

    return (
        <div className="w-full flex items-end justify-center gap-4 h-64 px-4 py-8 relative">
            {assets.map((asset, index) => {
                const heightPercentage = Math.max((asset.current_amount / maxValue) * 100, 20); // Min 20% height

                return (
                    <motion.div
                        key={asset.id}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: `${heightPercentage}%`, opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 1, type: "spring" }}
                        className="relative flex-1 max-w-[80px] group cursor-pointer"
                    >
                        {/* The Tower */}
                        <div className={`w-full h-full rounded-t-lg relative border-t border-l border-r border-white/20 backdrop-blur-md transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] ${asset.type === 'stock' ? 'bg-purple-900/40' : 'bg-emerald-900/40'
                            }`}>
                            <div className="absolute inset-x-0 top-0 h-1 bg-white/30" />
                            {/* Icon Floater */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs text-white whitespace-nowrap">
                                ₪{asset.current_amount.toLocaleString()}
                            </div>
                        </div>

                        {/* Label at bottom */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center w-full">
                            <div className="flex justify-center mb-1">
                                {asset.type === 'stock' ? <Building2 className="w-4 h-4 text-purple-400" /> : <Wallet className="w-4 h-4 text-emerald-400" />}
                            </div>
                            <span className="text-[10px] text-white/50 truncate block w-full px-1">{asset.name}</span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};
