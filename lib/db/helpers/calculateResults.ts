import { db } from "@/lib/db"
import type { Poll, PollOption, Vote, VoteToken, VoteLogEntry } from "@/lib/types"

export interface PollResults {
  poll: Poll
  options: PollOption[]
  totalVotes: number
  totalEligible: number
  participationRate: number
  quorumMet: boolean
  results: OptionResult[]
  winner?: string
  bordaWinners?: string[]
  yesNoResult?: {
    yes: number
    no: number
    abstain: number
    threshold: number
    passed: boolean
  }
  voteLogSummary: {
    total: number
    firstHash: string
    lastHash: string
  }
}

export interface OptionResult {
  optionId: string
  name: string
  votes: number
  percentage: number
  rank: number
}

export async function calculatePollResults(pollId: string): Promise<PollResults> {
  const poll = await db.collection("polls").findById<Poll>(pollId)
  if (!poll) throw new Error("Poll not found")

  const optionsResult = await db.collection("pollOptions").findMany<PollOption>({
    where: { pollId },
    orderBy: { field: "urutan", direction: "asc" },
  })
  const options = optionsResult.data

  // Get votes for this poll
  const votesResult = await db.collection("votes").findMany<Vote>({
    where: { pollId },
  })
  const votes = votesResult.data

  // Get eligible count
  const eligibleResult = await db.collection("pollEligibility").findMany({
    where: { pollId, type: "member" },
  })
  const totalEligible = eligibleResult.data.length

  // Get vote log entries
  const logResult = await db.collection("voteLog").findMany<VoteLogEntry>({
    where: { pollId },
    orderBy: { field: "chainIndex", direction: "asc" },
  })

  const totalVotes = votes.length
  const participationRate = totalEligible > 0 ? (totalVotes / totalEligible) * 100 : 0
  const quorumMet = participationRate >= poll.quorumPercentage

  const results: OptionResult[] = []
  const optionVotes: Record<string, number> = {}

  // Initialize all options with 0
  for (const opt of options) {
    optionVotes[opt.id] = 0
  }

  // Count votes based on poll type
  if (poll.type === "ranking") {
    // Borda Count: first choice gets n points, second gets n-1, etc.
    const bordaPoints: Record<string, number> = {}
    for (const opt of options) {
      bordaPoints[opt.id] = 0
    }

    for (const vote of votes) {
      if (vote.ranking) {
        const n = vote.ranking.length
        for (let i = 0; i < vote.ranking.length; i++) {
          const optId = vote.ranking[i]
          if (bordaPoints[optId] !== undefined) {
            bordaPoints[optId] += n - i
          }
        }
      }
    }

    const sortedByPoints = Object.entries(bordaPoints)
      .sort(([, a], [, b]) => b - a)
      .map(([optionId, points], idx) => {
        const opt = options.find((o) => o.id === optionId)
        return {
          optionId,
          name: opt?.name || "Unknown",
          votes: points,
          percentage: totalVotes > 0 ? (points / (totalVotes * options.length)) * 100 : 0,
          rank: idx + 1,
        }
      })

    return {
      poll,
      options,
      totalVotes,
      totalEligible,
      participationRate,
      quorumMet,
      results: sortedByPoints,
      bordaWinners: sortedByPoints.filter((r) => r.rank === 1).map((r) => r.name),
      voteLogSummary: {
        total: logResult.data.length,
        firstHash: logResult.data[0]?.previousHash || "genesis",
        lastHash: logResult.data[logResult.data.length - 1]?.hash || "",
      },
    }
  }

  if (poll.type === "yes-no") {
    let yes = 0
    let no = 0
    let abstain = 0

    for (const vote of votes) {
      const opt = options.find((o) => o.id === vote.optionIds[0])
      if (opt?.name === "Setuju" || opt?.name === "Ya") yes++
      else if (opt?.name === "Tidak Setuju" || opt?.name === "Tidak") no++
      else abstain++
    }

    const voteOptions = options.map((opt) => {
      let count = 0
      if (opt.name === "Setuju" || opt.name === "Ya") count = yes
      else if (opt.name === "Tidak Setuju" || opt.name === "Tidak") count = no
      else count = abstain

      return {
        optionId: opt.id,
        name: opt.name,
        votes: count,
        percentage: totalVotes > 0 ? (count / totalVotes) * 100 : 0,
        rank: 0,
      }
    })

    // Default threshold is simple majority (>50%)
    const threshold = 50
    const passed = totalVotes > 0 && (yes / totalVotes) * 100 > threshold

    return {
      poll,
      options,
      totalVotes,
      totalEligible,
      participationRate,
      quorumMet,
      results: voteOptions,
      yesNoResult: { yes, no, abstain, threshold, passed },
      voteLogSummary: {
        total: logResult.data.length,
        firstHash: logResult.data[0]?.previousHash || "genesis",
        lastHash: logResult.data[logResult.data.length - 1]?.hash || "",
      },
    }
  }

  // Single/Multiple choice
  for (const vote of votes) {
    for (const optId of vote.optionIds) {
      if (optionVotes[optId] !== undefined) {
        optionVotes[optId]++
      }
    }
  }

  const maxVotes = Math.max(...Object.values(optionVotes), 1)

  for (const [optionId, count] of Object.entries(optionVotes)) {
    const opt = options.find((o) => o.id === optionId)
    results.push({
      optionId,
      name: opt?.name || "Unknown",
      votes: count,
      percentage: totalVotes > 0 ? (count / totalVotes) * 100 : 0,
      rank: 0,
    })
  }

  results.sort((a, b) => b.votes - a.votes)
  results.forEach((r, idx) => {
    r.rank = idx + 1
  })

  const winner = results[0]?.name

  return {
    poll,
    options,
    totalVotes,
    totalEligible,
    participationRate,
    quorumMet,
    results,
    winner,
    voteLogSummary: {
      total: logResult.data.length,
      firstHash: logResult.data[0]?.previousHash || "genesis",
      lastHash: logResult.data[logResult.data.length - 1]?.hash || "",
    },
  }
}
