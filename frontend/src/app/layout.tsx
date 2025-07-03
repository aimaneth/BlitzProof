import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/providers/web3-provider";
import { Toaster } from "sonner";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BlitzProof - Web3 Security Platform",
  description: "Automated smart contract scanning and AI-powered vulnerability analysis",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <Web3Provider>
          {children}
          {/* Minimal sleek footer */}
          <footer className="w-full mt-24 border-t border-border/30 bg-background/80 backdrop-blur-sm py-6 flex items-center justify-center text-sm text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} BlitzProof. All rights reserved.</span>
          </footer>
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#ffffff',
                border: '1px solid #333333',
              },
            }}
          />
        </Web3Provider>
      </body>
    </html>
  );
}
