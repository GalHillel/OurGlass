"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Minimal template transitions to avoid heavy load, ensuring smoothness
    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
                key={pathname}
                initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                transition={{
                    duration: 0.3,
                    ease: [0.22, 1, 0.36, 1], // Custom fast-ease out
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
