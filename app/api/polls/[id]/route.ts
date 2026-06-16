import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkPermission } from "@/lib/auth/checkPermission"
import { auth } from "@/lib/auth/auth"
import { autoUpdatePollStatus } from "@/lib/db/helpers/autoUpdatePollStatus"
import type { Poll, AuditLog, PollOption, PollEligibility, Announcement, User, Notification } from "@/lib/types"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let poll = await db.collection("polls").findById<Poll>(id)
  if (!poll) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  poll = await autoUpdatePollStatus(poll)
  return NextResponse.json(poll)
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

  const perm = await checkPermission(session.user.roleId, "update", "polls")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()

    if (body.status === "Closed") {
      const closePerm = await checkPermission(session.user.roleId, "close", "polls")
      if (!closePerm.granted) {
        return NextResponse.json({ error: "Forbidden: cannot close poll" }, { status: 403 })
      }
    }

    const { options, eligibility, ...pollData } = body

    const poll = await db.collection("polls").update<Poll>(id, pollData)
    if (!poll) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (options) {
      const existing = await db.collection("pollOptions").findMany<PollOption>({
        where: { pollId: id },
      })
      for (const opt of existing.data) {
        await db.collection("pollOptions").delete(opt.id)
      }
      for (let i = 0; i < options.length; i++) {
        if (options[i].name) {
          await db.collection("pollOptions").create<PollOption>({
            pollId: id,
            name: options[i].name,
            description: options[i].description || "",
            foto: options[i].foto || undefined,
            urutan: i + 1,
          })
        }
      }
    }

    if (eligibility) {
      const existing = await db.collection("pollEligibility").findMany<PollEligibility>({
        where: { pollId: id },
      })
      for (const el of existing.data) {
        await db.collection("pollEligibility").delete(el.id)
      }
      for (const el of eligibility) {
        await db.collection("pollEligibility").create<PollEligibility>({
          pollId: id,
          type: el.type,
          referenceId: el.referenceId,
        })
      }
    }

    await db.collection("auditLogs").create<AuditLog>({
      userId: session.user.id,
      action: body.status === "Closed" ? "CLOSE" : body.status === "Cancelled" ? "CANCEL" : "UPDATE",
      resource: "polls",
      resourceId: id,
      after: JSON.stringify(pollData),
    })

    if (pollData.status === "Ongoing" || body.status === "Ongoing") {
      const allUsers = await db.collection("users").findMany<User>({ pagination: { page: 1, pageSize: 1000 } })
      for (const user of allUsers.data) {
        if (user.isActive !== false) {
          await db.collection("notifications").create<Notification>({
            userId: user.id,
            title: "Voting Baru",
            message: `Voting "${poll?.title}" telah dipublikasikan. Silakan berikan suara Anda.`,
            type: "info",
            isRead: false,
            link: `/polls/${id}/vote`,
          })
        }
      }

      await db.collection("announcements").create<Announcement>({
        title: `Voting Baru: ${poll?.title || "Poll"}`,
        content: `Voting "${poll?.title || "Poll"}" telah dipublikasikan. Silakan memberikan suara Anda melalui menu Polling.\n\nPeriode: ${poll?.startDate ? new Date(poll.startDate).toLocaleDateString("id-ID") : "-"} hingga ${poll?.endDate ? new Date(poll.endDate).toLocaleDateString("id-ID") : "-"}`,
        isPinned: true,
        readBy: [],
        createdBy: session.user.id,
      })
    }

    return NextResponse.json(poll)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update poll", details: String(error) },
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

  const perm = await checkPermission(session.user.roleId, "delete", "polls")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const deleted = await db.collection("polls").delete(id)
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
