'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-slate-950 text-white">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">אופס! משהו השתבש</h2>
            <p className="text-white/60 mb-6 max-w-xs">
                אל דאגה, הכסף שלך בטוח. נסו לרענן את העמוד.
            </p>
            <Button
                onClick={reset}
                className="bg-red-600 hover:bg-red-500 text-white rounded-full px-8"
            >
                נסה שוב
            </Button>
        </div>
    );
}
