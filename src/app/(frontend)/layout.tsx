import React from 'react'
import './styles.css'
import { Providers } from '@/providers'
import { Analytics } from '@vercel/analytics/next'

export const metadata = {
  description: 'Dashboard funcional de gimnasio sobre Payload CMS.',
  title: 'GYM OS',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
