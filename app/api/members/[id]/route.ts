import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkPermission } from "@/lib/auth/checkPermission"
import { auth } from "@/lib/auth/auth"
import type { Member } from "@/lib/types"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "read", "members")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const member = await db.collection("members").findById<Member>(id)
  if (!member) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(member)
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

  const perm = await checkPermission(session.user.roleId, "update", "members")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const member = await db.collection("members").update<Member>(id, body)
    if (!member) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json(member)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update member", details: String(error) },
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

  const perm = await checkPermission(session.user.roleId, "delete", "members")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const deleted = await db.collection("members").delete(id)
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
