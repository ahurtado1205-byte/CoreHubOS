import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CoreHub OS - PMS',
  description: 'Sistema de gestión de propiedades y cotizaciones',
};

import { PMSProvider } from '../context/PMSContext';
import { AuthGuard } from '../components/AuthGuard';
import { InteractiveTour } from '../components/tour/InteractiveTour';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} text-slate-900 antialiased bg-slate-100`}>
        <PMSProvider>
          <AuthGuard>
            <InteractiveTour />
            {children}
          </AuthGuard>
        </PMSProvider>
      </body>
    </html>
  );
}
