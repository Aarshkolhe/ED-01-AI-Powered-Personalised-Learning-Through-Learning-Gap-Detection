'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/lib/context';
import { Navigation } from '@/components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen flex flex-col`}>
        <AppProvider>
          <Navigation />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>LearnLens AI &bull; Autonomous Gap Remediation & Bayesian Knowledge Tracing</span>
              <span>Demo Mode Active &bull; Fully Functional Local Environment</span>
            </div>
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
