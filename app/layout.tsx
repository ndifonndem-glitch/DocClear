import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { ShieldCheck } from "lucide-react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // WCAG 1.4.4: Never disable user zoom
};

export const metadata: Metadata = {
  title: "Doc Clear",
  description: "Snap it or upload it. Get a plain-language explanation you can read or listen to.",
  manifest: "/manifest.webmanifest?v=2",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2" },
      { url: "/favicon-32x32.png?v=2", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png?v=2", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-192x192.png?v=2", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
      { url: "/icons/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Doc Clear",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 text-slate-900 antialiased">
      <body className={`${inter.className} min-h-[100dvh] flex flex-col pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]`}>
        {/* WCAG 2.4.1: Bypass Blocks */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-3 focus:min-h-[44px] focus:inline-flex focus:items-center focus:bg-blue-600 focus:text-white focus:font-semibold focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700"
        >
          Skip to main content
        </a>

        {/* Global Navigation matching Image 1, 2, 4 */}
        <Navbar />

        {/* Main Content Area */}
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none pb-28 sm:pb-12 w-full">
          <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-6 sm:py-8">
            {children}
          </div>
        </main>

        {/* Global Accessible Footer (Visible on all screen sizes, including mobile) */}
        <footer className="bg-white border-t border-slate-200 py-6 mt-auto w-full">
          <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" aria-hidden="true" />
              <span>Processed temporarily • Never saved without permission • WCAG 2.2 AA</span>
            </div>
            <p className="text-center sm:text-right">DocClear</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
