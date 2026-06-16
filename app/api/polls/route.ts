import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkPermission } from "@/lib/auth/checkPermission"
import { auth } from "@/lib/auth/auth"
import { autoUpdatePollStatus } from "@/lib/db/helpers/autoUpdatePollStatus"
import type { Poll, Announcement, User, Notification } from "@/lib/types"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = parseInt(searchParams.get("pageSize") || "50")
  const status = searchParams.get("status") || ""
  const type = searchParams.get("type") || ""
  const search = searchParams.get("search") || ""

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (type) where.type = type

  const result = await db.collection("polls").findMany<Poll>({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { field: "createdAt", direction: "desc" },
    pagination: { page, pageSize },
  })

  let data = await Promise.all(result.data.map(autoUpdatePollStatus))
  if (search) {
    const q = search.toLowerCase()
    data = data.filter((p) => p.title.toLowerCase().includes(q))
    result.total = data.length
  }
  result.data = data

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "create", "polls")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const poll = await db.collection("polls").create<Poll>({
      ...body,
      status: body.status || "Draft",
      createdBy: session.user.id,
    })

    if (body.status === "Ongoing") {
      const allUsers = await db.collection("users").findMany<User>({ pagination: { page: 1, pageSize: 1000 } })
      for (const user of allUsers.data) {
        if (user.isActive !== false) {
          await db.collection("notifications").create<Notification>({
            userId: user.id,
            title: "Voting Baru",
            message: `Voting "${poll.title}" telah dipublikasikan. Silakan berikan suara Anda.`,
            type: "info",
            isRead: false,
            link: `/polls/${poll.id}/vote`,
          })
        }
      }

      await db.collection("announcements").create<Announcement>({
        title: `Voting Baru: ${poll.title}`,
        content: `Voting "${poll.title}" telah dipublikasikan. Silakan memberikan suara Anda melalui menu Polling.\n\nPeriode: ${poll.startDate ? new Date(poll.startDate).toLocaleDateString("id-ID") : "-"} hingga ${poll.endDate ? new Date(poll.endDate).toLocaleDateString("id-ID") : "-"}`,
        isPinned: true,
        readBy: [],
        createdBy: session.user.id,
      })
    }

    return NextResponse.json(poll, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create poll", details: String(error) },
      { status: 500 }
    )
  }
}
