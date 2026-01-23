import type React from "react";
import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";
import MainLayoutClient from "@/components/main-layout-client";
import SessionProviderWrapper from "@/components/session-provider";

const sourceSansPro = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans-pro",
});

export const metadata: Metadata = {
  title: "IJF Ticket Admin",
  description: "Admin panel for IJF ticket management system",
  generator: "v0.app",
};

export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${sourceSansPro.variable} ${sourceSansPro.className}`}>
        <SessionProviderWrapper>
          <MainLayoutClient>{children}</MainLayoutClient>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
