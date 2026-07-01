import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { NavBar } from '@/components/layout/NavBar'
import { siteConfig } from '@/config/site'

//testing redeploy

const inter = Inter({ subsets: ['latin'] })

const GlobalElectricFilter = () => (
  <svg className="fixed top-0 left-0 w-0 h-0 pointer-events-none">
    <defs>
      <filter id="bl-electric-border" x="-500%" y="-500%" width="1000%" height="1000%">
        
        <feTurbulence
          type="turbulence"
          baseFrequency="0.02"
          numOctaves="3"
          seed="2"
          result="noise"
        />

        <feOffset in="noise" dx="0" dy="0" result="flow">
          <animate
            attributeName="dy"
            values="0; 80; 0"
            dur="10s"
            repeatCount="indefinite"
            calcMode="linear"
          />
        </feOffset>

        <feDisplacementMap
          in="SourceGraphic"
          in2="flow"
          scale="16"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  </svg>
);








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
        
        {/* Render the global filter ONCE */}
        <GlobalElectricFilter />

        <NavBar mode="global" />
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
