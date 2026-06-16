import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    roleId: string
    memberId?: string
    mustChangePassword: boolean
    username: string
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      roleId: string
      memberId?: string
      mustChangePassword: boolean
      username: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roleId: string
    memberId?: string
    mustChangePassword: boolean
    username: string
  }
}
