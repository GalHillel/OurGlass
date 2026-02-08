import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { AIChatButton } from "@/components/AIChatButton";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

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
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'OurGlass',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <body className={`${heebo.variable} bg-slate-950 text-white antialiased font-sans h-full overflow-x-hidden overflow-y-auto`}>
        <AuthProvider>
          {/* Clean solid background - LiquidBackground removed */}
          <main className="native-scroll touch-scroll relative z-10 w-full p-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))]">
            {children}
          </main>
          <BottomNav />
          <PWAInstallPrompt />
          <Toaster
            position="top-center"
            theme="dark"
            richColors
            toastOptions={{
              className: "border-white/20 text-white font-sans",
              style: {
                background: "rgba(15, 23, 42, 0.9)", // slate-900/90
                backdropFilter: "blur(10px)",
                color: "white",
                borderColor: "rgba(255,255,255,0.1)"
              }
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
