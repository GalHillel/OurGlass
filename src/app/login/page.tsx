"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();

    const handleEnterDemo = () => {
        router.push("/");
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="text-center space-y-8 max-w-md">
                {/* Logo/Title */}
                <div className="space-y-4">
                    <h1 className="text-5xl font-bold text-white">
                        OurGlass
                    </h1>
                    <p className="text-xl text-white/60">
                        Static Portfolio Demo
                    </p>
                    <p className="text-sm text-white/40">
                        Explore the app with impressive mock data - no login required
                    </p>
                </div>

                {/* Demo Enter Button */}
                <button
                    onClick={handleEnterDemo}
                    className="group relative w-full px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xl font-bold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95"
                >
                    <span className="flex items-center justify-center gap-3">
                        Enter Demo
                        <ArrowLeft className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </span>
                </button>

                {/* Info */}
                <div className="text-xs text-white/30 space-y-2">
                    <p>✓ No internet connection required</p>
                    <p>✓ Hardcoded success data</p>
                    <p>✓ Fully functional UI</p>
                </div>
            </div>
        </div>
    );
}
