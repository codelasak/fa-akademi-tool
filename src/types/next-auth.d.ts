import NextAuth, { DefaultSession } from "next-auth"
import { UserRole } from "@/generated/prisma"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      username: string
      firstName: string
      lastName: string
      teacherProfile?: any
      principalProfile?: any
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: UserRole
    username: string
    firstName: string
    lastName: string
    teacherProfile?: any
    principalProfile?: any
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    username: string
    firstName: string
    lastName: string
    teacherProfile?: any
    principalProfile?: any
  }
}