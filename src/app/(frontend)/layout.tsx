import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Dashboard funcional de gimnasio sobre Payload CMS.',
  title: 'Sistema Gimnasio',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
