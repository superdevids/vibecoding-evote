import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { calculatePollResults } from "@/lib/db/helpers/calculateResults"
import { db } from "@/lib/db"
import type { Poll } from "@/lib/types"

function canViewResults(poll: Poll, roleId: string) {
  if (poll.visibility === "committee-only") {
    return roleId === "role-super-admin" || roleId === "role-election-committee"
  }
  if (poll.visibility === "public-after-close") {
    return poll.status === "Closed"
  }
  return true
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const roleId = session.user.roleId as string
  const { searchParams } = new URL(req.url)
  const pollId = searchParams.get("pollId")

  if (pollId) {
    try {
      const poll = await db.collection("polls").findById<Poll>(pollId)
      if (!poll) {
        return NextResponse.json({ error: "Poll not found" }, { status: 404 })
      }

      if (!canViewResults(poll, roleId)) {
        return NextResponse.json({ error: "Anda tidak memiliki akses ke hasil ini" }, { status: 403 })
      }

      const results = await calculatePollResults(pollId)
      return NextResponse.json(results)
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  }

  // Return all closed polls with basic results
  const pollsResult = await db.collection("polls").findMany<Poll>({
    where: { status: "Closed" },
    orderBy: { field: "endDate", direction: "desc" },
  })

  const accessiblePolls = pollsResult.data.filter((p) => canViewResults(p, roleId))

  const allResults = await Promise.all(
    accessiblePolls.map(async (poll) => {
      try {
        return await calculatePollResults(poll.id)
      } catch {
        return null
      }
    })
  )

  return NextResponse.json({ data: allResults.filter(Boolean) })
}
