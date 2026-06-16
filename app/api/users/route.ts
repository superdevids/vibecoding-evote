import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/auth"
import { checkPermission } from "@/lib/auth/checkPermission"
import bcrypt from "bcryptjs"
import type { User, Role, PaginatedResult } from "@/lib/types"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "read", "users")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = parseInt(searchParams.get("pageSize") || "20")
  const search = searchParams.get("search") || ""

  const result = await db.collection("users").findMany<User>({
    orderBy: { field: "createdAt", direction: "desc" },
    pagination: { page, pageSize },
  })

  const roles = await db.collection("roles").findMany<Role>({ pagination: { page: 1, pageSize: 1000 } })
  const roleMap = new Map(roles.data.map((r) => [r.id, r.name]))

  let data = result.data.map((u) => ({
    ...u,
    passwordHash: undefined,
    roleName: roleMap.get(u.roleId) || "",
  }))

  if (search) {
    const q = search.toLowerCase()
    data = data.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.roleName && u.roleName.toLowerCase().includes(q))
    )
  }

  return NextResponse.json({
    data,
    total: data.length,
    page,
    pageSize,
    totalPages: Math.ceil(data.length / pageSize),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "create", "users")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { email, username, password, roleId, memberId } = body

    if (!email || !username || !password || !roleId) {
      return NextResponse.json({ error: "email, username, password, and roleId are required" }, { status: 400 })
    }

    const existing = await db.collection("users").findOne<User>({ email })
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    const existingUsername = await db.collection("users").findOne<User>({ username })
    if (existingUsername) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await db.collection("users").create<User>({
      email,
      username,
      passwordHash,
      roleId,
      memberId: memberId || null,
      mustChangePassword: true,
      isActive: true,
    })

    const safeUser = { ...user, passwordHash: undefined }
    return NextResponse.json(safeUser, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create user", details: String(error) },
      { status: 500 }
    )
  }
}
