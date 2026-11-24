import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pizza Fucktor — Fate posto a tavola',
  description: 'Cinque coppie, cinque pizzerie e una serata da decidere insieme.',
  icons: { icon: '/assets/festival/pizza.webp' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
