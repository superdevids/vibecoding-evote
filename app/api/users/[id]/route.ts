import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/auth"
import { checkPermission } from "@/lib/auth/checkPermission"
import type { User, Role } from "@/lib/types"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "read", "users")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const user = await db.collection("users").findById<User>(id)
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const role = await db.collection("roles").findById<{ name: string }>(user.roleId)

  return NextResponse.json({
    ...user,
    passwordHash: undefined,
    roleName: role?.name || "",
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "update", "users")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const allowedFields: Record<string, unknown> = {}

    if (body.roleId !== undefined) allowedFields.roleId = body.roleId
    if (body.isActive !== undefined) allowedFields.isActive = body.isActive
    if (body.memberId !== undefined) allowedFields.memberId = body.memberId
    if (body.mustChangePassword !== undefined) allowedFields.mustChangePassword = body.mustChangePassword

    const user = await db.collection("users").update<User>(id, allowedFields)
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ ...user, passwordHash: undefined })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user", details: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "delete", "users")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const deleted = await db.collection("users").delete(id)
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
