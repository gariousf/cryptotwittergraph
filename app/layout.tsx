import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Link from "next/link"
import { Zap, BarChart2, Smile, TrendingUp, RadioTower, Search } from "lucide-react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UFind - Social Trend & Launch Detection",
  description: "Discover crypto trends, sentiment, and new launches.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="flex flex-col min-h-screen">
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
              <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2 mr-4">
                  <Search className="h-6 w-6 text-blue-400" />
                  <h1 className="text-xl font-bold">UFind</h1>
                </Link>
                <div className="ml-auto flex items-center gap-2">
                  <Link href="/analytics" className="p-2 text-gray-400 hover:text-white" title="Analytics">
                    <BarChart2 className="h-5 w-5" />
                  </Link>
                  <Link href="/sentiment" className="p-2 text-gray-400 hover:text-white" title="Sentiment Analysis">
                    <Smile className="h-5 w-5" />
                  </Link>
                  <Link href="/price-correlation" className="p-2 text-gray-400 hover:text-white" title="Price Correlation">
                    <TrendingUp className="h-5 w-5" />
                  </Link>
                  <Link href="/launch-detector" className="p-2 text-gray-400 hover:text-white" title="Launch Detector">
                    <RadioTower className="h-5 w-5" />
                  </Link>
                  <Link href="/topics" className="p-2 text-gray-400 hover:text-white" title="Topics">
                    <Zap className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'