import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/auth"
import { checkPermission } from "@/lib/auth/checkPermission"
import type { OrganizationUnit } from "@/lib/types"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const result = await db.collection("organizationUnits").findMany<OrganizationUnit>({
    orderBy: { field: "name", direction: "asc" },
  })
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const perm = await checkPermission(session.user.roleId, "create", "organizationUnits")
  if (!perm.granted) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const unit = await db.collection("organizationUnits").create<OrganizationUnit>(body)
  return NextResponse.json(unit, { status: 201 })
}
