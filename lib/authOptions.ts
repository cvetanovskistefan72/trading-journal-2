import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { routes } from "@/config/routes";
import { rateLimit } from "@/lib/rate-limit";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      email?: string | null;
      name?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    name?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // 10 login attempts per IP+email per 15 min. Blunts brute force.
        const ip =
          (req?.headers?.["x-forwarded-for"] as string)?.split(",")[0].trim() ??
          "unknown";
        const email = credentials.email.trim().toLowerCase();
        const limit = rateLimit(
          `login:${ip}:${email}`,
          10,
          15 * 60 * 1000
        );
        if (!limit.ok) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.name = token.name;
      }
      return session;
    },
  },

  pages: {
    signIn: routes.login,
  },
};
