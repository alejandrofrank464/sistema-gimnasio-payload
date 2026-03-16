import React from 'react'
import './styles.css'

import { Providers } from '@/providers'

export const metadata = {
  description: 'Dashboard funcional de gimnasio sobre Payload CMS.',
  title: 'Sistema Gimnasio',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
