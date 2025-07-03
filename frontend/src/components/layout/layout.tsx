"use client"

import { Header } from "./header"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 