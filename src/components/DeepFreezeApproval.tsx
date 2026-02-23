"use client";

import { useState } from "react";
import { Shield, ShieldCheck, ShieldAlert, X, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { hapticWarning, hapticSuccess, hapticHeavy } from "@/utils/haptics";

interface DeepFreezeRequest {
    id: string;
    goalName: string;
    amount: number;
    requestedBy: string;
    status: "pending" | "approved" | "rejected";
}

interface DeepFreezeApprovalProps {
    isOpen: boolean;
    onClose: () => void;
    request: DeepFreezeRequest | null;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
}

/**
 * Deep Freeze Approval Dialog
 * When a partner tries to withdraw from a frozen asset, the other partner gets this dialog.
 */
export function DeepFreezeApproval({ isOpen, onClose, request, onApprove, onReject }: DeepFreezeApprovalProps) {
    const [processing, setProcessing] = useState(false);

    if (!request) return null;

    const handleApprove = async () => {
        setProcessing(true);
        hapticSuccess();
        onApprove(request.id);
        toast.success("הבקשה אושרה");
        setProcessing(false);
        onClose();
    };

    const handleReject = async () => {
        setProcessing(true);
        hapticHeavy();
        onReject(request.id);
        toast("הבקשה נדחתה", { icon: "❌" });
        setProcessing(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white sm:max-w-sm" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <ShieldAlert className="w-5 h-5 text-orange-400" />
                        בקשת שחרור מהקפאה
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Warning Banner */}
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm text-orange-200 font-bold">שימו לב!</p>
                            <p className="text-xs text-orange-200/70">
                                בן/בת הזוג מבקש/ת לשחרר כספים מנכס מוקפא. אישור יפתח את הנכס למשיכה.
                            </p>
                        </div>
                    </div>

                    {/* Request Details */}
                    <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/5">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">נכס</span>
                            <span className="font-bold text-white">{request.goalName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">סכום</span>
                            <span className="font-bold text-orange-400">₪{request.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">מבקש/ת</span>
                            <span className="font-bold text-white">{request.requestedBy}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            onClick={handleReject}
                            disabled={processing}
                            className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                        >
                            <X className="w-4 h-4 ml-1" />
                            דחייה
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={processing}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Check className="w-4 h-4 ml-1" />
                            אישור
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Deep Freeze toggle indicator for asset cards
 */
export function DeepFreezeToggle({
    isFrozen,
    onToggle,
}: {
    isFrozen: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            onClick={() => {
                hapticWarning();
                onToggle();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${isFrozen
                ? "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                : "bg-white/5 text-white/30 border border-white/10 hover:bg-white/10"
                }`}
            title={isFrozen ? "נכס מוקפא — נדרש אישור למשיכה" : "הפעל הקפאה עמוקה"}
        >
            {isFrozen ? (
                <>
                    <ShieldCheck className="w-3 h-3" />
                    מוקפא
                </>
            ) : (
                <>
                    <Shield className="w-3 h-3" />
                    הקפאה
                </>
            )}
        </button>
    );
}
