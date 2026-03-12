"use client";

import { DEMO_MODE } from "@/demo/demo-config";
import { Info, RotateCcw } from "lucide-react";
import { mockDB } from "@/demo/mock-db";
import { toast } from "sonner";

export function DemoBanner() {
    if (!DEMO_MODE) return null;

    const handleReset = () => {
        if (confirm("האם ברצונך לאפס את נתוני הדמו? כל השינויים שביצעת יימחקו.")) {
            mockDB.reset();
            toast.success("נתוני הדמו הופסו בהצלחה");
            window.location.reload();
        }
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-indigo-600/90 backdrop-blur-md text-white px-4 py-1.5 flex items-center justify-between text-[12px] font-bold border-b border-white/20">
            <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5" />
                <span>סביבת דמו פעילה - הנתונים מקומיים בלבד</span>
            </div>
            <button 
                onClick={handleReset}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-md transition-colors border border-white/10"
            >
                <RotateCcw className="w-3 h-3" />
                <span>איפוס דמו</span>
            </button>
        </div>
    );
}
