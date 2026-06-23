import type { Metadata } from 'next'
import {Inter} from 'next/font/google'
import './globals.css'
import {NavBar } from '@/components/layout/NavBar'
import { siteConfig } from '@/config/site'

const inter = Inter({ subsets: ['latin']})
export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
    return (
      <html lang="en" className="dark">
        <body className={`${inter.className} bg-background text-foreground min-h-screen`}>
          <NavBar />
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </body>
      </html> 
    )
  }

