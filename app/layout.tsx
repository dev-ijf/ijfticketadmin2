import type React from "react";
import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";
import MainLayoutClient from "@/components/main-layout-client";
import SessionProviderWrapper from "@/components/session-provider";
import { generateDynamicMetadata } from "@/lib/database";
import DynamicMetadata from "@/components/dynamic-metadata";

const sourceSansPro = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans-pro",
});

// Gunakan metadata dinamis dari database (settings)
export const generateMetadata = generateDynamicMetadata;

export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${sourceSansPro.variable} ${sourceSansPro.className}`}>
        {/* Komponen client-side untuk menjaga title & favicon selalu sinkron
            dengan perubahan di Settings (mendengarkan event settingsUpdated/metadataUpdated) */}
        <DynamicMetadata />
        <SessionProviderWrapper>
          <MainLayoutClient>{children}</MainLayoutClient>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

export const metadata = {
      generator: 'v0.app'
    };
