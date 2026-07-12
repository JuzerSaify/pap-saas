import React from 'react'
import './globals.css'

export const metadata = {
  title: 'PAPSoft SaaS — Beta',
  description: 'Enterprise ERP for Paper & Board industry. Now in public beta.'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sifonn&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}
