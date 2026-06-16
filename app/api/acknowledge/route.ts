import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/auth"
import type { CompanyDocument } from "@/lib/types"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !session.user.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { docId } = await req.json()

    if (!docId) {
      return NextResponse.json({ error: "docId is required" }, { status: 400 })
    }

    const doc = await db.collection("companyDocuments").findById<CompanyDocument>(docId)
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    if (doc.acknowledgedBy.includes(session.user.memberId)) {
      return NextResponse.json({ success: true, message: "Already acknowledged" })
    }

    const updated = await db.collection("companyDocuments").update<CompanyDocument>(docId, {
      acknowledgedBy: [...doc.acknowledgedBy, session.user.memberId],
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to acknowledge document", details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !session.user.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const docId = searchParams.get("docId")

  if (!docId) {
    return NextResponse.json({ error: "docId is required" }, { status: 400 })
  }

  const doc = await db.collection("companyDocuments").findById<CompanyDocument>(docId)
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  const acknowledged = doc.acknowledgedBy.includes(session.user.memberId)

  return NextResponse.json({
    acknowledged,
    acknowledgedAt: null,
    totalAcknowledged: doc.acknowledgedBy.length,
  })
}
