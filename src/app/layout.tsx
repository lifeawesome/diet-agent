import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DietAgent',
  description: 'Your intelligent health and nutrition dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
