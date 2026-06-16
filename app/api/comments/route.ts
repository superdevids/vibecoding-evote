import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/auth"
import { checkPermission } from "@/lib/auth/checkPermission"
import type { Comment, Poll } from "@/lib/types"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const pollId = searchParams.get("pollId")
  if (!pollId) return NextResponse.json({ error: "pollId required" }, { status: 400 })

  const result = await db.collection("comments").findMany<Comment>({
    where: { pollId, isHidden: false },
    orderBy: { field: "createdAt", direction: "asc" },
  })
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !session.user.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "create", "comments")
  if (!perm.granted) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()

  const poll = await db.collection("polls").findById<Poll>(body.pollId)
  if (!poll) return NextResponse.json({ error: "Poll not found" }, { status: 404 })
  if (poll.status !== "Ongoing") {
    return NextResponse.json({ error: "Diskusi hanya dapat diakses saat voting berlangsung" }, { status: 400 })
  }

  const comment = await db.collection("comments").create<Comment>({
    pollId: body.pollId,
    memberId: session.user.memberId,
    content: body.content,
    isHidden: false,
    parentId: body.parentId,
  })
  return NextResponse.json(comment, { status: 201 })
}
