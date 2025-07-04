import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientRoot from "./client-root";
import "@/lib/polyfills";

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
      <body className={inter.className}>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
