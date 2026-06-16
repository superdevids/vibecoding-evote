import { db } from "@/lib/db"
import type { Poll } from "@/lib/types"

export async function autoUpdatePollStatus(poll: Poll): Promise<Poll> {
  if (poll.status === "Cancelled") return poll

  const now = new Date()
  const start = new Date(poll.startDate)
  const end = new Date(poll.endDate)

  if ((poll.status === "Draft" || poll.status === "Scheduled") && now >= start && now < end) {
    const updated = await db.collection("polls").update<Poll>(poll.id, { status: "Ongoing" })
    if (updated) return updated
  }

  if (poll.status === "Ongoing" && now >= end) {
    const updated = await db.collection("polls").update<Poll>(poll.id, { status: "Closed" })
    if (updated) return updated
  }

  return poll
}
