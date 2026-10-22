'use client';

import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/context';
import { Navigation } from '@/components/Navigation';
import { ThinkFlowLogo } from '@/components/ThinkFlowLogo';
import { GlobalVideoBackground } from '@/components/GlobalVideoBackground';

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
        <title>ThinkFlow — Smarter Learning, Deeper Understanding</title>
        <meta
          name="description"
          content="Stop guessing why students struggle. Isolate learning gaps with mathematical precision with ThinkFlow."
        />
        <link rel="icon" type="image/png" href="/thinkflow-icon.png" />
      </head>
      <body className={`${plusJakarta.className} bg-[#0A0F1D] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500 selection:text-slate-950 relative`}>
        {/* Global Animated Flow-Motion Video Background & Atmospheric Overlays */}
        <GlobalVideoBackground />

        <AppProvider>
          <div className="relative z-10 flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-slate-800/80 bg-[#0B1120]/80 py-6 text-center text-xs text-slate-400 backdrop-blur-md">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <ThinkFlowLogo size="sm" withLink />
                  <span className="font-medium text-slate-300">
                    ThinkFlow &bull; Autonomous Gap Remediation & Bayesian Knowledge Tracing
                  </span>
                </div>
                <span className="text-slate-400">
                  Smarter Learning. Deeper Understanding. &bull; Demo Mode Active
                </span>
              </div>
            </footer>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
