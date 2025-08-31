import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientRoot from "./client-root";
import "@/lib/polyfills";
import { Analytics } from '@vercel/analytics/next';



const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BlitzProof Security Scanner",
  description: "Advanced smart contract security scanner with AI-powered analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0D0E0E" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BlitzProof" />

        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <ClientRoot>{children}</ClientRoot>
        <Analytics />

      </body>
    </html>
  );
}
