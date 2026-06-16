import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import type { User } from "@/lib/types"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username/Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const username = credentials.username as string
        const password = credentials.password as string

        const usersResults = await db.collection("users").findMany<User>({
          where: {
            isActive: true,
          },
        })

        const user = usersResults.data.find(
          (u) =>
            (u.username === username || u.email === username) && u.isActive
        )

        if (!user) return null

        const passwordMatch = await bcrypt.compare(password, user.passwordHash)
        if (!passwordMatch) return null

        const memberResult = user.memberId
          ? await db.collection("members").findById(user.memberId)
          : null

        return {
          id: user.id,
          email: user.email,
          name: memberResult
            ? (memberResult as { namaLengkap: string }).namaLengkap
            : user.username,
          roleId: user.roleId,
          memberId: user.memberId,
          mustChangePassword: user.mustChangePassword,
          username: user.username,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (trigger === "update") {
        const fresh = await db.collection("users").findById(token.sub!)
        if (fresh) {
          const f = fresh as unknown as {
            roleId: string
            memberId?: string
            mustChangePassword: boolean
            username: string
          }
          token.roleId = f.roleId
          token.memberId = f.memberId
          token.mustChangePassword = f.mustChangePassword
          token.username = f.username
        }
        return token
      }
      if (user) {
        const u = user as unknown as {
          roleId: string
          memberId?: string
          mustChangePassword: boolean
          username: string
        }
        token.roleId = u.roleId
        token.memberId = u.memberId
        token.mustChangePassword = u.mustChangePassword
        token.username = u.username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
        session.user.roleId = token.roleId as string
        session.user.memberId = token.memberId as string
        session.user.mustChangePassword = token.mustChangePassword as boolean
        session.user.username = token.username as string
      }
      return session
    },
  },
})
