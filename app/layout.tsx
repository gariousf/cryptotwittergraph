import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import Link from "next/link"
import { Zap, BarChart2, Smile, TrendingUp } from "lucide-react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CryptoGraph - Social Network Visualization",
  description: "Explore the connections between crypto Twitter accounts",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="flex flex-col min-h-screen">
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
              <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2 mr-4">
                  <Zap className="h-6 w-6 text-emerald-400" />
                  <h1 className="text-xl font-bold">CryptoGraph</h1>
                </Link>
                <div className="ml-auto flex items-center gap-2">
                  <Link href="/analytics" className="p-2 text-gray-400 hover:text-white">
                    <BarChart2 className="h-5 w-5" />
                  </Link>
                  <Link href="/sentiment" className="p-2 text-gray-400 hover:text-white">
                    <Smile className="h-5 w-5" />
                  </Link>
                  <Link href="/price-correlation" className="p-2 text-gray-400 hover:text-white">
                    <TrendingUp className="h-5 w-5" />
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