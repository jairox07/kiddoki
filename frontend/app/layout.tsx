import './globals.css';
import type { ReactNode } from 'react';
import { Bricolage_Grotesque, Nunito_Sans, Baloo_2 } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', weight: ['500', '700', '800'] });
const body = Nunito_Sans({ subsets: ['latin'], variable: '--font-body', weight: ['400', '600', '700'] });
const kid = Baloo_2({ subsets: ['latin'], variable: '--font-kid', weight: ['500', '700'] });

export const metadata = {
  title: 'Kiddoki: aprender jugando, anónimo por diseño',
  description: 'Plataforma educativa para niños de 1 a 11 años. Juegos curados, gamificación real y anonimidad total garantizada por arquitectura, no por promesa.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable} ${kid.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
