'use client';

import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/context';
import { Navigation } from '@/components/Navigation';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${plusJakarta.variable}`}>
      <head>
        <title>Thinkflow — Precision AI Learning Platform</title>
        <meta
          name="description"
          content="Stop guessing why students struggle. Isolate learning gaps with mathematical precision with Thinkflow."
        />
      </head>
      <body className={`${plusJakarta.className} bg-[#241B15] text-[#EAE0D2] min-h-screen flex flex-col antialiased selection:bg-[#25DCC6] selection:text-[#2D2D2D]`}>
        <AppProvider>
          <Navigation />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[#D7C9AE]/15 bg-[#1E1611]/90 py-6 text-center text-xs text-[#EAE0D2]/60 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-medium text-[#EAE0D2]/80">
                Thinkflow &bull; Autonomous Gap Remediation & Bayesian Knowledge Tracing
              </span>
              <span className="text-[#D7C9AE]/70">Demo Mode Active &bull; Fully Functional Local Environment</span>
            </div>
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
