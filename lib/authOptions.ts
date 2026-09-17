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
    testFlag: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      testFlag: boolean;
      email?: string | null;
      name?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    testFlag: boolean;
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

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, password: true, role: true, disabled: true, testFlag: true },
        });
        if (!user || !user.password) return null;
        if (user.disabled) return null;

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
          testFlag: user.testFlag,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.testFlag = user.testFlag;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.name = token.name;
        session.user.testFlag = token.testFlag;
      }
      return session;
    },
  },

  pages: {
    signIn: routes.login,
  },
};
