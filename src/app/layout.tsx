import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { LiquidBackground } from "@/components/LiquidBackground";
import { IdentityGate } from "@/components/IdentityGate";
import { AIChatButton } from "@/components/AIChatButton";
import { GlobalStealthHandler } from "@/components/GlobalStealthHandler";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

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
      <body className={`${heebo.variable} text-white antialiased font-sans h-full overflow-x-hidden overflow-y-auto`}>
        <LiquidBackground />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    // Registration successful
                  }, function(err) {
                    // Registration failed
                  });
                });
              }
            `,
          }}
        />
        <AuthProvider>
          <QueryProvider>
            <ErrorBoundary>
              <IdentityGate>
                <main className="native-scroll touch-scroll relative z-10 w-full p-4 pt-[env(safe-area-inset-top)] pb-0">
                  <GlobalStealthHandler />
                  {children}
                </main>
              </IdentityGate>
            </ErrorBoundary>
            <BottomNav />
            <PWAInstallPrompt />
            <Toaster
              position="top-center"
              theme="dark"
              richColors
              toastOptions={{
                className: "border-white/20 text-white font-sans",
                style: {
                  background: "rgba(15, 23, 42, 0.9)",
                  backdropFilter: "blur(10px)",
                  color: "white",
                  borderColor: "rgba(255,255,255,0.1)"
                }
              }}
            />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
