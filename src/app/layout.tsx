import type { Metadata, Viewport } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/sidebar-nav';
import { Header } from '@/components/header';
import { Toaster } from '@/components/ui/toaster';
import { SessionProvider } from '@/components/session-provider';
import { ServiceWorkerRegistrar } from '@/components/service-worker-registrar';

export const metadata: Metadata = {
  title: 'Logic Looper — Daily Puzzle Game',
  description: 'Play and solve daily logic puzzles. Track your streak, earn achievements, and compete on the leaderboard. Works offline.',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'Logic Looper',
    description: 'Daily logic puzzles with streaks, heatmaps, and achievements.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#414BEA',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased min-h-screen w-full')}>
        <SessionProvider>
          <SidebarProvider>
            <SidebarNav />
            <SidebarInset>
              <Header />
              <main className="p-4 sm:p-6 lg:p-8 bg-background">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </SessionProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
