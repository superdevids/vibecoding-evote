"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, XCircle, Download, Shield } from "lucide-react"
import { VoteBarChart } from "@/components/charts/vote-bar-chart"
import { VotePieChart } from "@/components/charts/vote-pie-chart"

interface OptionResult {
  optionId: string
  name: string
  votes: number
  percentage: number
  rank: number
}

interface YesNoResult {
  yes: number
  no: number
  abstain: number
  threshold: number
  passed: boolean
}

interface VoteLogSummary {
  total: number
  firstHash: string
  lastHash: string
}

interface PollResults {
  poll: {
    id: string
    title: string
    type: string
    quorumPercentage: number
    startDate: string
    endDate: string
  }
  totalVotes: number
  totalEligible: number
  participationRate: number
  quorumMet: boolean
  results: OptionResult[]
  winner?: string
  bordaWinners?: string[]
  yesNoResult?: YesNoResult
  voteLogSummary: VoteLogSummary
}

export default function PollResultsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<PollResults | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/results?pollId=${params.id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("Gagal memuat hasil"))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Data tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/results")}>
          Kembali
        </Button>
      </div>
    )
  }

  const maxVotes = Math.max(...data.results.map((r) => r.votes), 1)
  const isYesNo = data.poll.type === "yes-no"
  const isRanking = data.poll.type === "ranking"

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{data.poll.title}</CardTitle>
            {data.quorumMet ? (
              <Badge variant="success">Kuorum Tercapai</Badge>
            ) : (
              <Badge variant="destructive">Kuorum Tidak Tercapai</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center mb-6">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{data.totalEligible}</p>
              <p className="text-xs text-muted-foreground">Pemilih Terdaftar</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{data.totalVotes}</p>
              <p className="text-xs text-muted-foreground">Suara Masuk</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-2xl font-bold">{data.participationRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Partisipasi</p>
            </div>
          </div>

          <Progress
            value={data.participationRate}
            className="h-3 mb-2"
          />
          <p className="text-xs text-muted-foreground text-center">
            Target kuorum: {data.poll.quorumPercentage}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isYesNo ? "Hasil Voting" : isRanking ? "Hasil Peringkat (Borda Count)" : "Hasil Perhitungan Suara"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isYesNo && data.yesNoResult && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-success/5 border border-success/20">
                <p className="text-3xl font-bold text-success">{data.yesNoResult.yes}</p>
                <p className="text-sm text-muted-foreground">Setuju</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="text-3xl font-bold text-destructive">{data.yesNoResult.no}</p>
                <p className="text-sm text-muted-foreground">Tidak Setuju</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-3xl font-bold">{data.yesNoResult.abstain}</p>
                <p className="text-sm text-muted-foreground">Abstain</p>
              </div>
            </div>
          )}

          {data.results.map((result) => (
            <div key={result.optionId} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {!isYesNo && (
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {result.rank}
                    </span>
                  )}
                  <span className="font-medium">{result.name}</span>
                  {result.rank === 1 && !isRanking && !isYesNo && (
                    <Badge variant="success" className="text-[10px] px-1.5 py-0">Pemenang</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className="font-mono text-sm">{result.votes}</span>
                  <span className="w-12 text-right text-xs">{result.percentage.toFixed(1)}%</span>
                </div>
              </div>
              <Progress value={result.votes} max={maxVotes} className="h-2" />
            </div>
          ))}

          {isYesNo && data.yesNoResult && (
            <div className={`p-3 rounded-lg text-center mt-4 ${data.yesNoResult.passed ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <p className="font-semibold text-sm">
                {data.yesNoResult.passed ? "✓ RANGANGAN DISETUJUI" : "✗ RANGANGAN DITOLAK"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Threshold: &gt;{data.yesNoResult.threshold}% suara setuju
              </p>
            </div>
          )}

          {isRanking && data.bordaWinners && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <p className="font-semibold text-sm">Pemenang Borda Count</p>
              <p className="text-lg font-bold text-primary mt-1">{data.bordaWinners.join(", ")}</p>
            </div>
          )}

          {data.winner && !isYesNo && !isRanking && (
            <div className="p-3 rounded-lg bg-success/5 border border-success/20 text-center">
              <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
              <p className="text-sm text-muted-foreground">Pemenang</p>
              <p className="text-xl font-bold">{data.winner}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Section */}
      {!isYesNo && data.results.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribusi Suara</CardTitle>
            </CardHeader>
            <CardContent>
              <VoteBarChart data={data.results} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Proporsi Suara</CardTitle>
            </CardHeader>
            <CardContent>
              <VotePieChart data={data.results} />
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informasi Integritas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>Total entri log: {data.voteLogSummary.total}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>Hash awal: <span className="font-mono text-xs">{data.voteLogSummary.firstHash}</span></span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>Hash akhir: <span className="font-mono text-xs">{data.voteLogSummary.lastHash}</span></span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/verification?pollId=${data.poll.id}`)}
          >
            <Shield className="h-4 w-4 mr-2" />
            Verifikasi Integritas
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
