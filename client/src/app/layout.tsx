import type { Metadata } from 'next';
import './globals.css';

import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';

config.autoAddCss = false;

export const metadata: Metadata = {
  title: 'World Sim',
  description: 'Simulation of a procedurally generated world by Simon Karman',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={'antialiased'}
      >
        {children}
      </body>
    </html>
  );
}
