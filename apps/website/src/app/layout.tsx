import React from 'react'
import './globals.css'

export const metadata = {
  title: 'PAPSoft SaaS',
  description: 'Enterprise ERP solutions for Paper & Board industry'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  )
}
