import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkPermission } from "@/lib/auth/checkPermission"
import { auth } from "@/lib/auth/auth"
import type { Member } from "@/lib/types"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "read", "members")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = parseInt(searchParams.get("pageSize") || "50")
  const search = searchParams.get("search") || ""
  const status = searchParams.get("status") || ""
  const orgUnit = searchParams.get("organizationUnitId") || ""
  const sortField = searchParams.get("sortField") || "createdAt"
  const sortDir = searchParams.get("sortDir") || "desc"

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (orgUnit) where.organizationUnitId = orgUnit

  const result = await db.collection("members").findMany<Member>({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { field: sortField, direction: sortDir as "asc" | "desc" },
    pagination: { page, pageSize },
  })

  let data = result.data
  if (search) {
    const q = search.toLowerCase()
    data = data.filter(
      (m) =>
        m.namaLengkap.toLowerCase().includes(q) ||
        m.nomorAnggota.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.nik && m.nik.toLowerCase().includes(q))
    )
    result.total = data.length
    result.data = data
  }

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "create", "members")
  if (!perm.granted) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()

    // Generate member number
    const count = await db.collection("members").count()
    const period = "2026"
    const nomorAnggota = `MBR-${period}-${String(count + 1).padStart(4, "0")}`

    const member = await db.collection("members").create<Member>({
      ...body,
      nomorAnggota,
      status: body.status || "Aktif",
      verificationStatus: body.verificationStatus || "belum",
      tanggalBergabung: body.tanggalBergabung || new Date().toISOString(),
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create member", details: String(error) },
      { status: 500 }
    )
  }
}
