"use client";

import { motion, useAnimation, PanInfo, AnimatePresence } from "framer-motion";
import { Trash2, Edit2 } from "lucide-react";
import { useState, useRef } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SwipeableRowProps {
    children: React.ReactNode;
    onEdit?: () => void;
    onDelete?: () => void;
    deleteMessage?: string;
    className?: string;
    // Optional: thresholds for swipe trigger
    editThreshold?: number; // Swipe right distance
    deleteThreshold?: number; // Swipe left distance
}

export const SwipeableRow = ({
    children,
    onEdit,
    onDelete,
    deleteMessage = "האם אתה בטוח שברצונך למחוק פריט זה?",
    className = "",
    editThreshold = 100,
    deleteThreshold = -100
}: SwipeableRowProps) => {
    const controls = useAnimation();
    const [action, setAction] = useState<'none' | 'edit' | 'delete'>('none');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDragEnd = async (_: any, info: PanInfo) => {
        const offset = info.offset.x;

        if (offset > editThreshold && onEdit) {
            // Swipe Right -> Edit
            setAction('edit');
            // Trigger haptic if available
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);

            // Snap back and trigger edit
            await controls.start({ x: 0 });
            onEdit();
            setAction('none');
        } else if (offset < deleteThreshold && onDelete) {
            // Swipe Left -> Delete
            setAction('delete');
            if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);

            // Snap back and show dialog
            await controls.start({ x: 0 });
            setShowDeleteDialog(true);
            setAction('none'); // Reset visual state, dialog is open
        } else {
            // Snap back
            controls.start({ x: 0 });
            setAction('none');
        }
    };

    const handleDrag = (_: any, info: PanInfo) => {
        const offset = info.offset.x;
        if (offset > 50 && onEdit) {
            setAction('edit');
        } else if (offset < -50 && onDelete) {
            setAction('delete');
        } else {
            setAction('none');
        }
    };

    return (
        <div className={`relative overflow-hidden rounded-2xl ${className}`}>
            {/* Background Layer */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                {/* Right Side (Delete Result - visible when swiping Left) - RTL Start */}
                <div className={`flex-1 h-full flex items-center justify-start pr-6 transition-colors duration-300 ${action === 'delete' ? 'bg-red-600/80' : 'bg-transparent'}`}>
                    <Trash2 className={`w-6 h-6 text-white transition-opacity duration-200 ${action === 'delete' ? 'opacity-100' : 'opacity-0'}`} />
                </div>

                {/* Left Side (Edit Result - visible when swiping Right) - RTL End */}
                <div className={`flex-1 h-full flex items-center justify-end pl-6 transition-colors duration-300 ${action === 'edit' ? 'bg-blue-600/80' : 'bg-transparent'}`}>
                    <Edit2 className={`w-6 h-6 text-white transition-opacity duration-200 ${action === 'edit' ? 'opacity-100' : 'opacity-0'}`} />
                </div>
            </div>

            {/* Foreground Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }} // Elastic constraints
                dragElastic={0.1} // Feel resistance
                onDragEnd={handleDragEnd}
                onDrag={handleDrag}
                animate={controls}
                className="relative z-10 touch-pan-y" // Ensure vertical scroll still works, removed opaque bg
                whileTap={{ cursor: "grabbing" }}
            >
                {children}
            </motion.div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white rounded-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>מחיקת פריט</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                            {deleteMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl">ביטול</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (onDelete) await onDelete();
                                setShowDeleteDialog(false);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                        >
                            מחק
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
