import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/auth"
import { checkPermission } from "@/lib/auth/checkPermission"
import type { Settings } from "@/lib/types"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const settings = await db.collection("settings").findById<Settings>("settings-1")
  return NextResponse.json(settings)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const perm = await checkPermission(session.user.roleId, "update", "settings")
  if (!perm.granted) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const updated = await db.collection("settings").update<Settings>("settings-1", body)
  return NextResponse.json(updated)
}
