import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/auth"
import { checkPermission } from "@/lib/auth/checkPermission"
import type { Announcement } from "@/lib/types"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const result = await db.collection("announcements").findMany<Announcement>({
    orderBy: { field: "createdAt", direction: "desc" },
  })
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const perm = await checkPermission(session.user.roleId, "create", "announcements")
  if (!perm.granted) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const announcement = await db.collection("announcements").create<Announcement>({
    ...body,
    readBy: [],
    createdBy: session.user.id,
  })
  return NextResponse.json(announcement, { status: 201 })
}
