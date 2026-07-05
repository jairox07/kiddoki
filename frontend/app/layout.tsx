import './globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'Kiddoki — Aprende jugando, seguro' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 font-sans antialiased">{children}</body>
    </html>
  );
}
