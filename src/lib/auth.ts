import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { UserRole } from "@/generated/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: credentials.username },
              { email: credentials.username },
            ],
          },
          include: {
            teacherProfile: true,
            principalProfile: {
              include: {
                school: true,
              },
            },
          },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          teacherProfile: user.teacherProfile,
          principalProfile: user.principalProfile,
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
        token.role = user.role;
        token.username = user.username;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.teacherProfile = user.teacherProfile;
        token.principalProfile = user.principalProfile;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string;
        session.user.role = token.role as UserRole;
        session.user.username = token.username as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.teacherProfile = token.teacherProfile;
        session.user.principalProfile = token.principalProfile;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/error",
  },
};
