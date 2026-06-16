"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Vote, Shield, ExternalLink, CheckCircle2 } from "lucide-react"

interface MyVote {
  id: string
  pollId: string
  receiptHash: string
  timestamp: string
  hash: string
}

interface PollInfo {
  id: string
  title: string
  status: string
}

export default function MyVotesPage() {
  const router = useRouter()
  const [votes, setVotes] = useState<MyVote[]>([])
  const [pollNames, setPollNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadVotes = async () => {
      try {
        const res = await fetch("/api/votes")
        const data = await res.json()
        setVotes(data.data || [])

        // Fetch poll names
        const votesArray = (data.data || []) as MyVote[]
        const pollIds: string[] = [...new Set(votesArray.map((v) => v.pollId))]
        const names: Record<string, string> = {}
        await Promise.all(
          pollIds.map(async (pid) => {
            try {
              const r = await fetch(`/api/polls/${pid}`)
              const p = await r.json()
              names[pid] = p.title
            } catch {
              names[pid] = "Unknown Poll"
            }
          })
        )
        setPollNames(names)
      } catch {
        toast.error("Gagal memuat riwayat vote")
      } finally {
        setLoading(false)
      }
    }
    loadVotes()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Riwayat Vote Saya</h1>
        <p className="text-sm text-muted-foreground">
          Daftar voting yang telah Anda ikuti (pilihan Anda tetap rahasia)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Partisipasi Anda</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : votes.length === 0 ? (
            <div className="text-center py-12">
              <Vote className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Anda belum mengikuti voting apapun</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/polls")}>
                Lihat Poll Aktif
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {votes.map((vote) => (
                <div
                  key={vote.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/polls/${vote.pollId}/results`)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {pollNames[vote.pollId] || "Memuat..."}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-xs text-muted-foreground">
                        Receipt: {vote.receiptHash}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(vote.timestamp).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
