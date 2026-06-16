import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/auth"
import { checkPermission } from "@/lib/auth/checkPermission"
import type { Notification, Member, User } from "@/lib/types"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const { searchParams } = new URL(req.url)

  if (searchParams.get("unreadCount") === "true") {
    const unread = await db.collection("notifications").findMany<Notification>({
      where: { userId, isRead: false },
      pagination: { page: 1, pageSize: 1 },
    })
    return NextResponse.json({ count: unread.total })
  }

  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = parseInt(searchParams.get("pageSize") || "50")

  const result = await db.collection("notifications").findMany<Notification>({
    where: { userId },
    orderBy: { field: "createdAt", direction: "desc" },
    pagination: { page, pageSize },
  })

  return NextResponse.json(result)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, markAll } = body

    if (markAll) {
      const userNotifications = await db.collection("notifications").findMany<Notification>({
        where: { userId: session.user.id, isRead: false },
        pagination: { page: 1, pageSize: 1000 },
      })

      for (const n of userNotifications.data) {
        await db.collection("notifications").update(n.id, { isRead: true })
      }

      return NextResponse.json({ success: true })
    }

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const notification = await db.collection("notifications").findById<Notification>(id)
    if (!notification) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updated = await db.collection("notifications").update<Notification>(id, { isRead: true })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update notification", details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "create", "notifications")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { userId, title, message, type, link } = body

    if (!userId || !title || !message) {
      return NextResponse.json({ error: "userId, title, and message are required" }, { status: 400 })
    }

    const notification = await db.collection("notifications").create<Notification>({
      userId,
      title,
      message,
      type: type || "info",
      isRead: false,
      link: link || null,
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create notification", details: String(error) },
      { status: 500 }
    )
  }
}
