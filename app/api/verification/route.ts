import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { verifyVoteChain } from "@/lib/db/helpers/appendVoteLog"
import type { Poll, VoteLogEntry } from "@/lib/types"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const pollId = searchParams.get("pollId")

  if (pollId) {
    const result = await verifyVoteChain(pollId)
    return NextResponse.json(result)
  }

  // Get summary for all closed polls
  const pollsResult = await db.collection("polls").findMany<Poll>({
    where: { status: "Closed" },
    orderBy: { field: "endDate", direction: "desc" },
  })

  const summaries = await Promise.all(
    pollsResult.data.map(async (poll) => {
      const verification = await verifyVoteChain(poll.id)
      return {
        pollId: poll.id,
        pollTitle: poll.title,
        totalEntries: verification.entries.length,
        valid: verification.valid,
        anomalyCount: verification.anomalies.length,
      }
    })
  )

  return NextResponse.json({ data: summaries })
}
