import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/auth"
import { checkPermission } from "@/lib/auth/checkPermission"
import type { AuditLog } from "@/lib/types"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !session.user.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { pollId, reason } = await req.json()

    if (!pollId || !reason) {
      return NextResponse.json({ error: "pollId and reason are required" }, { status: 400 })
    }

    const poll = await db.collection("polls").findById(pollId)
    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 })
    }

    const disputeDetails = JSON.stringify({
      pollId,
      memberId: session.user.memberId,
      reason,
      voteTokenId: null,
      status: "pending",
    })

    const log = await db.collection("auditLogs").create<AuditLog>({
      userId: session.user.id,
      action: "DISPUTE",
      resource: "votes",
      resourceId: pollId,
      before: undefined,
      after: disputeDetails,
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    })

    return NextResponse.json({ success: true, id: log.id }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit dispute", details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "read", "auditLogs")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const pollId = searchParams.get("pollId")
  const status = searchParams.get("status")

  const result = await db.collection("auditLogs").findMany<AuditLog>({
    where: {
      action: "DISPUTE",
      resource: "votes",
      ...(pollId ? { resourceId: pollId } : {}),
    },
    orderBy: { field: "createdAt", direction: "desc" },
  })

  let disputes = result.data.map((log) => {
    const details = log.after ? JSON.parse(log.after) : {}
    return {
      id: log.id,
      userId: log.userId,
      pollId: log.resourceId,
      memberId: details.memberId,
      reason: details.reason,
      voteTokenId: details.voteTokenId,
      status: details.status || "pending",
      resolution: details.resolution,
      resolutionNote: details.resolutionNote,
      resolvedBy: details.resolvedBy,
      resolvedAt: details.resolvedAt,
      createdAt: log.createdAt,
    }
  })

  if (status) {
    disputes = disputes.filter((d) => d.status === status)
  }

  return NextResponse.json({ data: disputes, total: disputes.length })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "update", "auditLogs")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { id, resolution, resolutionNote } = await req.json()

    if (!id || !resolution || !["accepted", "rejected"].includes(resolution)) {
      return NextResponse.json(
        { error: "id and resolution (accepted|rejected) are required" },
        { status: 400 }
      )
    }

    const log = await db.collection("auditLogs").findById<AuditLog>(id)
    if (!log || log.action !== "DISPUTE") {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 })
    }

    const details = log.after ? JSON.parse(log.after) : {}
    if (details.status !== "pending") {
      return NextResponse.json({ error: "Dispute already resolved" }, { status: 400 })
    }

    details.status = "resolved"
    details.resolution = resolution
    details.resolutionNote = resolutionNote || ""
    details.resolvedBy = session.user.id
    details.resolvedAt = new Date().toISOString()

    await db.collection("auditLogs").update(id, {
      after: JSON.stringify(details),
    })

    await db.collection("auditLogs").create<AuditLog>({
      userId: session.user.id,
      action: "DISPUTE_RESOLUTION",
      resource: "votes",
      resourceId: log.resourceId,
      before: undefined,
      after: JSON.stringify({
        disputeId: id,
        resolution,
        resolutionNote: resolutionNote || "",
        originalDetails: details,
      }),
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to resolve dispute", details: String(error) },
      { status: 500 }
    )
  }
}
