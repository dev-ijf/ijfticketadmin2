import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import MainLayoutClient from "@/components/main-layout-client"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "IJF Ticket Admin",
  description: "Admin panel for IJF ticket management system",
  generator: "v0.app",
}

export const revalidate = 0

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <MainLayoutClient>{children}</MainLayoutClient>
      </body>
    </html>
  )
}
