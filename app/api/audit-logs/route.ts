import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/auth"
import { checkPermission } from "@/lib/auth/checkPermission"
import type { AuditLog } from "@/lib/types"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const perm = await checkPermission(session.user.roleId, "read", "auditLogs")
  if (!perm.granted) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get("page") || "1", 10)
  const pageSize = parseInt(url.searchParams.get("pageSize") || "50", 10)

  const result = await db.collection("auditLogs").findMany<AuditLog>({
    orderBy: { field: "createdAt", direction: "desc" },
    pagination: { page, pageSize },
  })
  return NextResponse.json(result)
}
