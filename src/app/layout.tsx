import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { LiquidBackground } from "@/components/LiquidBackground";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { AIChatButton } from "@/components/AIChatButton";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

import { Viewport } from "next";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: "OurGlass",
  description: "Couple Finance Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <body className={`${heebo.variable} bg-slate-950 text-white antialiased font-sans min-h-screen`}>
        <AuthProvider>
          <LiquidBackground />
          <main className="relative z-10 min-h-[100dvh] p-4 pb-24 pt-[calc(1rem+env(safe-area-inset-top))]">
            {children}
          </main>
          <BottomNav />
          <Toaster position="top-center" toastOptions={{
            className: "glass border-white/20 text-white",
            style: { background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }
          }} />
        </AuthProvider>
      </body>
    </html>
  );
}
