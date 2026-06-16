import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/auth"
import { checkPermission } from "@/lib/auth/checkPermission"
import type { PollOption } from "@/lib/types"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const pollId = searchParams.get("pollId")

  const where: Record<string, unknown> = {}
  if (pollId) where.pollId = pollId

  const result = await db.collection("pollOptions").findMany<PollOption>({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { field: "urutan", direction: "asc" },
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "create", "pollOptions")
  if (!perm.granted) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await req.json()
    const option = await db.collection("pollOptions").create<PollOption>(body)
    return NextResponse.json(option, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create option", details: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "delete", "pollOptions")
  if (!perm.granted) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }

  const deleted = await db.collection("pollOptions").delete(id)
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
