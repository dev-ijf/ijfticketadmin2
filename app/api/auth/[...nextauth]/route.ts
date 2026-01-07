import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getSql } from "@/lib/database";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    /**
     * Hanya izinkan login jika email sudah terdaftar di tabel users
     */
    async signIn({ user }) {
      const email = user.email;
      if (!email) {
        return "/login?error=AccessDenied";
      }

      try {
        const sql = getSql();
        const result = await sql`
          SELECT id, email, role
          FROM users
          WHERE email = ${email}
          LIMIT 1
        `;

        if (!Array.isArray(result) || result.length === 0) {
          console.warn(
            "[Auth] Attempted login with email not in users table:",
            email,
          );
          return "/login?error=AccessDenied";
        }

        return true;
      } catch (error) {
        console.error("[Auth] Error checking user in database:", error);
        return "/login?error=Configuration";
      }
    },
    async session({ session, token }) {
      if (session.user) {
        // Simpan id dari token jika ada
        if (token.sub) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (session.user as any).id = token.sub;
        }
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
