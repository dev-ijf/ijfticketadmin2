import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MainLayoutClient from "@/components/main-layout-client";
import { generateDynamicMetadata } from "@/lib/database";

const inter = Inter({ subsets: ["latin"] });

// Generate metadata dynamically on the server
export const generateMetadata: () => Promise<Metadata> =
  generateDynamicMetadata;

// Ensure the layout is always dynamically rendered to get fresh metadata
export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <MainLayoutClient>{children}</MainLayoutClient>
      </body>
    </html>
  );
}

export const metadata = {
      generator: 'v0.app'
    };
