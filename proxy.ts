import { auth } from "@/lib/auth/auth"

// Next.js 16: proxy.ts replaces middleware.ts
// Use auth() as the proxy function for route protection
const handler = auth

export { handler as proxy }

export const config = {
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico|logo.svg|uploads).*)"],
}
