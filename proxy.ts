import type { NextMiddleware } from "next/server";
import nextAuthProxy from "next-auth/middleware";

/**
 * Next.js 16+: gunakan `proxy.ts` dengan export bernama `proxy`.
 * Export `default` saja sering memicu "handler is not a function" di Turbopack.
 *
 * File `midleware.ts` (salah eja) tidak pernah dibaca Next; NextAuth dipasang di sini.
 */
const runAuth = nextAuthProxy as NextMiddleware;

export const proxy: NextMiddleware = (request, event) =>
  runAuth(request, event);

export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
