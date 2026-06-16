import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth/auth"
import { checkPermission } from "@/lib/auth/checkPermission"
import { appendVoteLog } from "@/lib/db/helpers/appendVoteLog"
import { autoUpdatePollStatus } from "@/lib/db/helpers/autoUpdatePollStatus"
import type { VoteToken, Vote, Poll, Member } from "@/lib/types"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !session.user.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const perm = await checkPermission(session.user.roleId, "create", "votes")
  if (!perm.granted) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const { pollId, optionIds, ranking } = await req.json()

    if (!pollId || !optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      return NextResponse.json({ error: "Invalid vote data" }, { status: 400 })
    }

    // Check poll exists and is ongoing
    let poll = await db.collection("polls").findById<Poll>(pollId)
    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 })
    }
    poll = await autoUpdatePollStatus(poll)
    if (poll.status !== "Ongoing") {
      return NextResponse.json({ error: "Poll is not active" }, { status: 400 })
    }

    // Check eligibility
    const eligibility = await db.collection("pollEligibility").findOne({
      pollId,
      type: "member",
      referenceId: session.user.memberId,
    })
    if (!eligibility) {
      return NextResponse.json({ error: "You are not eligible for this poll" }, { status: 403 })
    }

    // Check existing vote token
    const existingToken = await db.collection("voteTokens").findOne<VoteToken>({
      pollId,
      memberId: session.user.memberId,
      isUsed: true,
    })
    if (existingToken) {
      return NextResponse.json({ error: "You have already voted in this poll" }, { status: 400 })
    }

    // Generate or reuse vote token
    let voteToken = await db.collection("voteTokens").findOne<VoteToken>({
      pollId,
      memberId: session.user.memberId,
      isUsed: false,
    })

    if (!voteToken) {
      const token = `VT-${crypto.randomBytes(16).toString("hex").toUpperCase()}`
      voteToken = await db.collection("voteTokens").create<VoteToken>({
        token,
        pollId,
        memberId: session.user.memberId,
        isUsed: false,
        expiresAt: poll.endDate,
      })
    }

    // Mark token as used
    const now = new Date().toISOString()
    await db.collection("voteTokens").update(voteToken.id, {
      isUsed: true,
      usedAt: now,
    })

    // Generate vote hash
    const salt = "evote-salt-2026"
    const voteData = JSON.stringify({
      pollId,
      optionIds,
      voteTokenId: voteToken.id,
      timestamp: now,
      ranking: ranking || undefined,
    })
    const hash = crypto.createHash("sha256").update(`${voteData}|${salt}`).digest("hex")

    // Generate receipt hash (different from integrity hash, for voter verification)
    const receiptInput = `${voteToken.id}|${hash}|${session.user.memberId}|${now}`
    const receiptHash = crypto.createHash("sha256").update(receiptInput).digest("hex").substring(0, 16).toUpperCase()

    // Create vote record
    const vote = await db.collection("votes").create<Vote>({
      pollId,
      voteTokenId: voteToken.id,
      optionIds,
      ranking: ranking || undefined,
      hash,
      receiptHash,
      timestamp: now,
    })

    // Append to vote log (tamper-evident chain)
    await appendVoteLog({
      pollId,
      voteId: vote.id,
      data: voteData,
    })

    return NextResponse.json({
      success: true,
      receiptHash,
      voteId: vote.id,
      message: "Suara Anda berhasil direkam! Simpan hash receipt untuk verifikasi mandiri.",
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit vote", details: String(error) },
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
  const pollId = searchParams.get("pollId")

  // Get member's vote tokens to find their votes
  const tokenWhere: Record<string, unknown> = {
    memberId: session.user.memberId,
    isUsed: true,
  }
  if (pollId) tokenWhere.pollId = pollId

  const tokensResult = await db.collection("voteTokens").findMany<VoteToken>({
    where: tokenWhere,
    orderBy: { field: "usedAt", direction: "desc" },
  })

  const tokenIds = tokensResult.data.map((t) => t.id)

  if (tokenIds.length === 0) {
    return NextResponse.json({ data: [] })
  }

  // Get votes by token IDs
  const votesResult = await db.collection("votes").findMany<Vote>({
    where: { voteTokenId: tokenIds },
    orderBy: { field: "createdAt", direction: "desc" },
  })

  // Return only receipt hash and poll info (not the actual choice for privacy)
  const safeVotes = votesResult.data.map((v) => ({
    id: v.id,
    pollId: v.pollId,
    receiptHash: v.receiptHash,
    timestamp: v.timestamp,
    hash: v.hash,
  }))

  return NextResponse.json({ data: safeVotes, total: safeVotes.length })
}
