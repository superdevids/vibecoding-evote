import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/auth"
import { checkPermission } from "@/lib/auth/checkPermission"
import type { PollEligibility } from "@/lib/types"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "read", "pollEligibility")
  if (!perm.granted) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const pollId = searchParams.get("pollId")

  if (!pollId) {
    return NextResponse.json({ error: "pollId required" }, { status: 400 })
  }

  const result = await db.collection("pollEligibility").findMany<PollEligibility>({
    where: { pollId },
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "create", "pollEligibility")
  if (!perm.granted) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await req.json()

    // Check if already exists
    const existing = await db.collection("pollEligibility").findOne<PollEligibility>({
      pollId: body.pollId,
      type: body.type,
      referenceId: body.referenceId,
    })

    if (existing) {
      return NextResponse.json(existing)
    }

    const eligibility = await db.collection("pollEligibility").create<PollEligibility>(body)
    return NextResponse.json(eligibility, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create eligibility", details: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "delete", "pollEligibility")
  if (!perm.granted) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 })
  }

  const deleted = await db.collection("pollEligibility").delete(id)
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
