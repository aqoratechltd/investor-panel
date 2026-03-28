import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | InvestorPanel',
    default: 'InvestorPanel — Premium Investment Platform',
  },
  description: 'A multi-tenant SaaS investment platform for sellers and investors. Track investments, profits, and grow your portfolio.',
  keywords: ['investment', 'fintech', 'SaaS', 'portfolio', 'profit tracking'],
  authors: [{ name: 'InvestorPanel' }],
  creator: 'InvestorPanel',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://investorpanel.io',
    title: 'InvestorPanel — Premium Investment Platform',
    description: 'A multi-tenant SaaS investment platform',
    siteName: 'InvestorPanel',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InvestorPanel',
    description: 'Premium Investment Platform',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="noise-overlay min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* Ambient background glows */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div
              className="ambient-glow-teal"
              style={{ top: '-200px', left: '-200px' }}
            />
            <div
              className="ambient-glow-teal"
              style={{ bottom: '-200px', right: '-200px', opacity: 0.5 }}
            />
          </div>

          {children}

          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'hsl(222 44% 8%)',
                color: 'hsl(210 40% 96%)',
                border: '1px solid hsl(217 33% 14%)',
                borderRadius: '12px',
                fontSize: '13px',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: 'transparent' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: 'transparent' },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
