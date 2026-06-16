"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { BarChart3, CheckCircle2, XCircle, Download } from "lucide-react"

interface PollResultsSummary {
  poll: { id: string; title: string; endDate: string; type: string }
  totalVotes: number
  totalEligible: number
  participationRate: number
  quorumMet: boolean
  winner?: string
  voteLogSummary: { total: number }
}

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<PollResultsSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/results")
      .then((r) => r.json())
      .then((d) => setResults(d.data || []))
      .catch(() => toast.error("Gagal memuat hasil"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hasil & Rekap</h1>
        <p className="text-sm text-muted-foreground">Hasil voting yang telah selesai</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Belum ada hasil voting</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {results.map((r) => (
            <Card
              key={r.poll.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/polls/${r.poll.id}/results`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{r.poll.title}</CardTitle>
                  {r.quorumMet ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{r.totalVotes}</p>
                    <p className="text-xs text-muted-foreground">Suara</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{r.participationRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Partisipasi</p>
                  </div>
                  <div>
                    <Badge variant={r.quorumMet ? "success" : "destructive"}>
                      {r.quorumMet ? "Kuorum" : "Tak Kuorum"}
                    </Badge>
                  </div>
                </div>
                {r.winner && (
                  <p className="text-sm text-center mt-3 text-muted-foreground">
                    Pemenang: <span className="font-semibold text-foreground">{r.winner}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
