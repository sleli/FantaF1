import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { Titillium_Web } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const titillium = Titillium_Web({
  subsets: ['latin'],
  weight: ['200', '300', '400', '600', '700', '900'],
  variable: '--font-titillium',
  display: 'swap',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it" className={titillium.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        <meta name="theme-color" content="#15151e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FantaF1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <title>FantaF1 - Fantasy Formula 1</title>
        <meta name="description" content="Piattaforma per il gioco Fantasy Formula 1 - Pronostica i primi 3 classificati" />
      </head>
      <body className="min-h-screen bg-background text-foreground mobile-tap-highlight smooth-scroll antialiased selection:bg-primary selection:text-primary-foreground">
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
