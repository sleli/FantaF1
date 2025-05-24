import type { ReactNode } from 'react';
import { Providers } from './providers';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="it">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>FantaF1 - Fantasy Formula 1</title>
        <meta name="description" content="Piattaforma per il gioco Fantasy Formula 1 - Pronostica i primi 3 classificati" />
      </head>
      <body className="min-h-screen bg-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
