import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { Providers } from './providers';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        <meta name="theme-color" content="#E10600" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FantaF1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <title>FantaF1 - Fantasy Formula 1</title>
        <meta name="description" content="Piattaforma per il gioco Fantasy Formula 1 - Pronostica i primi 3 classificati" />

        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for common external resources */}
        <link rel="dns-prefetch" href="//accounts.google.com" />
        <link rel="dns-prefetch" href="//lh3.googleusercontent.com" />
      </head>
      <body className="min-h-screen bg-gray-50 mobile-tap-highlight smooth-scroll">
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
