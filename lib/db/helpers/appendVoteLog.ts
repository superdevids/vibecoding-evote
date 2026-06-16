import crypto from 'crypto'
import { db } from '@/lib/db'
import type { VoteLogEntry } from '@/lib/types'

export async function appendVoteLog(params: {
  pollId: string
  voteId: string
  data: string
}): Promise<VoteLogEntry> {
  const { pollId, voteId, data } = params

  const allLogs = await db.collection('voteLog').findMany<VoteLogEntry>({
    where: { pollId },
    orderBy: { field: 'chainIndex', direction: 'desc' },
    pagination: { page: 1, pageSize: 1 },
  })

  const previousHash = allLogs.data.length > 0 ? allLogs.data[0].hash : 'genesis'
  const previousIndex = allLogs.data.length > 0 ? allLogs.data[0].chainIndex : -1

  const timestamp = new Date().toISOString()
  const hashInput = `${data}|${previousHash}|${pollId}|${voteId}|${new Date(timestamp).getTime()}`
  const hash = crypto.createHash('sha256').update(hashInput).digest('hex')

  const entry = await db.collection('voteLog').append<VoteLogEntry>({
    pollId,
    voteId,
    hash,
    previousHash,
    data,
    timestamp,
    chainIndex: previousIndex + 1,
  })

  return entry
}

export async function verifyVoteChain(pollId: string): Promise<{
  valid: boolean
  entries: VoteLogEntry[]
  anomalies: number[]
}> {
  const result = await db.collection('voteLog').findMany<VoteLogEntry>({
    where: { pollId },
    orderBy: { field: 'chainIndex', direction: 'asc' },
  })

  const entries = result.data
  const anomalies: number[] = []

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const expectedPreviousHash = i === 0 ? 'genesis' : entries[i - 1].hash
    if (entry.previousHash !== expectedPreviousHash) {
      anomalies.push(entry.chainIndex)
    }

    const expectedHashInput = `${entry.data}|${entry.previousHash}|${entry.pollId}|${entry.voteId}|${new Date(entry.timestamp).getTime()}`
    const expectedHash = crypto.createHash('sha256').update(expectedHashInput).digest('hex')
    if (entry.hash !== expectedHash) {
      anomalies.push(entry.chainIndex)
    }
  }

  return {
    valid: anomalies.length === 0,
    entries,
    anomalies,
  }
}
