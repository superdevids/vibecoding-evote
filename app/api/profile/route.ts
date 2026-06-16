import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/auth"
import bcrypt from "bcryptjs"
import type { User } from "@/lib/types"

async function findUser(sessionUser: { id?: string; email?: string | null }): Promise<User | null> {
  if (sessionUser.id) {
    return db.collection("users").findById<User>(sessionUser.id)
  }
  const all = await db.collection("users").findMany<User>({ where: { isActive: true } })
  return all.data.find((u) => u.email === sessionUser.email) ?? null
}

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await findUser(session.user)
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const role = await db.collection("roles").findById<{ name: string }>(user.roleId)

  return NextResponse.json({
    id: user.id,
    email: user.email,
    username: user.username,
    roleName: role?.name || "",
    memberId: user.memberId,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
  })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await findUser(session.user)
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  try {
    const body = await req.json()
    const updates: Record<string, unknown> = {}

    if (body.email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        return NextResponse.json({ error: "Email tidak valid" }, { status: 400 })
      }

      const existing = await db.collection("users").findMany<User>({
        where: { isActive: true },
      })
      const duplicate = existing.data.find(
        (u) => u.email === body.email && u.id !== user.id
      )
      if (duplicate) {
        return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 })
      }

      updates.email = body.email
    }

    if (body.newPassword) {
      if (!body.currentPassword) {
        return NextResponse.json(
          { error: "Password saat ini wajib diisi" },
          { status: 400 }
        )
      }

      const valid = await bcrypt.compare(body.currentPassword, user.passwordHash)
      if (!valid) {
        return NextResponse.json(
          { error: "Password saat ini salah" },
          { status: 400 }
        )
      }

      if (body.newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password baru minimal 6 karakter" },
          { status: 400 }
        )
      }

      updates.passwordHash = await bcrypt.hash(body.newPassword, 12)
      updates.mustChangePassword = false
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang diubah" }, { status: 400 })
    }

    const updated = await db.collection("users").update<User>(user.id, updates)
    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Profil berhasil diperbarui" })
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memperbarui profil", details: String(error) },
      { status: 500 }
    )
  }
}
