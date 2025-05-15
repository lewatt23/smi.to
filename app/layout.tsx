import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'smi.to ',
  description: 'smi.to shorten URL',
}

import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${poppins.className}`}>{children}</body>
    </html>
  )
}
