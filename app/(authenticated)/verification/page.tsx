"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { Shield, ShieldCheck, ShieldAlert, ArrowLeft } from "lucide-react"

interface PollSummary {
  pollId: string
  pollTitle: string
  totalEntries: number
  valid: boolean
  anomalyCount: number
}

interface VoteLogVerification {
  valid: boolean
  entries: Array<{
    id: string
    chainIndex: number
    hash: string
    previousHash: string
    timestamp: string
    pollId: string
  }>
  anomalies: number[]
}

export default function VerificationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pollIdParam = searchParams.get("pollId")
  const [polls, setPolls] = useState<PollSummary[]>([])
  const [detail, setDetail] = useState<VoteLogVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPoll, setSelectedPoll] = useState<string | null>(pollIdParam)

  useEffect(() => {
    if (selectedPoll) {
      setLoading(true)
      fetch(`/api/verification?pollId=${selectedPoll}`)
        .then((r) => r.json())
        .then(setDetail)
        .catch(() => toast.error("Gagal memuat verifikasi"))
        .finally(() => setLoading(false))
    } else {
      setLoading(true)
      fetch("/api/verification")
        .then((r) => r.json())
        .then((d) => setPolls(d.data || []))
        .catch(() => toast.error("Gagal memuat daftar"))
        .finally(() => setLoading(false))
    }
  }, [selectedPoll])

  if (selectedPoll && detail) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedPoll(null); setDetail(null) }}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Daftar
        </Button>

        <div className="flex items-center gap-3">
          {detail.valid ? (
            <div className="flex items-center gap-2 text-success">
              <ShieldCheck className="h-6 w-6" />
              <span className="font-semibold">Status: Valid - Tidak ada anomali terdeteksi</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-6 w-6" />
              <span className="font-semibold">Status: ANOMALI TERDETEKSI ({detail.anomalies.length} entry)</span>
            </div>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Chain Index</TableHead>
                  <TableHead>Previous Hash</TableHead>
                  <TableHead>Hash</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.entries.map((entry) => {
                  const isAnomaly = detail.anomalies.includes(entry.chainIndex)
                  return (
                    <TableRow key={entry.id} className={isAnomaly ? "bg-destructive/5" : ""}>
                      <TableCell className="font-mono text-xs">{entry.chainIndex}</TableCell>
                      <TableCell className="font-mono text-xs">{entry.chainIndex}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate" title={entry.previousHash}>
                        {entry.previousHash.substring(0, 16)}...
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate" title={entry.hash}>
                        {entry.hash.substring(0, 16)}...
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        {isAnomaly ? (
                          <Badge variant="destructive">Anomali</Badge>
                        ) : (
                          <Badge variant="success">Valid</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verifikasi Integritas</h1>
        <p className="text-sm text-muted-foreground">
          Audit trail voting dengan chain hash tamper-evident
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : polls.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Belum ada poll yang dapat diverifikasi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {polls.map((poll) => (
            <Card
              key={poll.pollId}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedPoll(poll.pollId)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{poll.pollTitle}</CardTitle>
                  {poll.valid ? (
                    <ShieldCheck className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total entry log: {poll.totalEntries}</span>
                  <Badge variant={poll.valid ? "success" : "destructive"}>
                    {poll.valid ? "Valid" : `${poll.anomalyCount} Anomali`}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
