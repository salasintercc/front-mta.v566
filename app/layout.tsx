import type React from "react"
import type { Metadata } from "next"
import { League_Spartan, Lato } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "@/contexts/language-context"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-league-spartan",
})

const lato = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  variable: "--font-lato",
})

export const metadata: Metadata = {
  title: "Meet the Architect",
  description: "Descubre los eventos arquitectónicos más exclusivos",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${leagueSpartan.variable} ${lato.variable}`}>
        <AuthProvider>
          <LanguageProvider>{children}</LanguageProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
