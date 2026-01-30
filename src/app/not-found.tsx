import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPinOff } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-slate-950 text-white">
            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 neon-card border-blue-500/20">
                <MapPinOff className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-black mb-2 neon-text">404</h2>
            <p className="text-lg font-bold text-white mb-2">העמוד לא נמצא</p>
            <p className="text-white/50 mb-8 max-w-xs">
                נראה שהלכתם לאיבוד בעולם הפיננסי. בואו נחזור למקום בטוח.
            </p>
            <Link href="/">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                    חזרה הביתה
                </Button>
            </Link>
        </div>
    );
}
