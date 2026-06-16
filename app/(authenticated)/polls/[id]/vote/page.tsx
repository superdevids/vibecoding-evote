"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { toast } from "sonner"
import { ArrowLeft, Clock, Shield, CheckCircle2, AlertTriangle } from "lucide-react"

interface PollDetail {
  id: string
  title: string
  description: string
  type: string
  status: string
  startDate: string
  endDate: string
  allowComments: boolean
  randomizeOptions: boolean
}

interface PollOption {
  id: string
  name: string
  description?: string
  foto?: string
  urutan: number
}

export default function VotePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [poll, setPoll] = useState<PollDetail | null>(null)
  const [options, setOptions] = useState<PollOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [ranking, setRanking] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [receiptHash, setReceiptHash] = useState("")
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pollRes, optionsRes] = await Promise.all([
          fetch(`/api/polls/${params.id}`),
          fetch(`/api/poll-options?pollId=${params.id}`),
        ])
        const pollData = await pollRes.json()
        const optionsData = await optionsRes.json()

        setPoll(pollData)
        let opts = optionsData.data || optionsData

        // Shuffle options if randomize is enabled
        if (pollData.randomizeOptions) {
          opts = [...opts].sort(() => Math.random() - 0.5)
        }

        setOptions(opts)

        // Check if already voted
        const voteCheck = await fetch(`/api/votes?pollId=${params.id}`)
        const voteData = await voteCheck.json()
        if (voteData.data && voteData.data.length > 0) {
          setHasVoted(true)
        }
      } catch {
        toast.error("Gagal memuat data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params.id])

  const toggleOption = (optionId: string) => {
    if (poll?.type === "single-choice" || poll?.type === "yes-no") {
      setSelectedOptions([optionId])
    } else if (poll?.type === "multiple-choice") {
      setSelectedOptions((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      )
    }
  }

  const moveRank = useCallback((index: number, direction: "up" | "down") => {
    setRanking((prev) => {
      const newRank = [...prev]
      const swapIdx = direction === "up" ? index - 1 : index + 1
      if (swapIdx < 0 || swapIdx >= newRank.length) return prev
      ;[newRank[index], newRank[swapIdx]] = [newRank[swapIdx], newRank[index]]
      return newRank
    })
  }, [])

  useEffect(() => {
    if (poll?.type === "ranking" && options.length > 0 && ranking.length === 0) {
      setRanking(options.map((o) => o.id))
    }
  }, [poll?.type, options, ranking.length])

  const handleSubmitVote = async () => {
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        pollId: params.id,
        optionIds: selectedOptions,
      }
      if (poll?.type === "ranking") {
        body.optionIds = ranking
        body.ranking = ranking
      }

      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim suara")
      }

      setReceiptHash(data.receiptHash)
      setSubmitted(true)
      toast.success("Suara berhasil direkam!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim suara")
    } finally {
      setSubmitting(false)
      setConfirmOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p>Poll tidak ditemukan</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold">Suara Berhasil Direkam!</h2>
        <p className="text-muted-foreground">
          Terima kasih telah berpartisipasi. Suara Anda telah tercatat secara aman dan transparan.
        </p>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Hash Receipt Anda:</p>
            <p className="font-mono text-xs bg-muted p-2 rounded break-all">{receiptHash}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Simpan hash ini untuk verifikasi mandiri bahwa suara Anda tercatat.
            </p>
          </CardContent>
        </Card>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push("/polls")}>
            Kembali ke Poll
          </Button>
          <Button onClick={() => router.push(`/polls/${params.id}/results`)}>
            Lihat Hasil
          </Button>
        </div>
      </div>
    )
  }

  if (poll.status !== "Ongoing") {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Poll Tidak Aktif</h2>
        <p className="text-muted-foreground mt-2">
          Poll ini tidak dalam masa voting.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/polls")}>
          Kembali
        </Button>
      </div>
    )
  }

  if (hasVoted) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-info/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-info" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold">Anda Sudah Memberikan Suara</h2>
        <p className="text-muted-foreground">
          Anda telah berpartisipasi dalam voting ini. Setiap anggota hanya dapat memberikan satu suara.
        </p>
        <Button onClick={() => router.push("/my-votes")}>
          Lihat Riwayat Vote Saya
        </Button>
      </div>
    )
  }

  const isYesNo = poll.type === "yes-no"
  const isRanking = poll.type === "ranking"
  const isMulti = poll.type === "multiple-choice"

  const timeLeft = new Date(poll.endDate).getTime() - Date.now()
  const daysLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24)))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/polls")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{poll.title}</CardTitle>
            {daysLeft > 0 && (
              <Badge variant="info">{daysLeft} hari tersisa</Badge>
            )}
          </div>
          <CardDescription>{poll.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isYesNo ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggleOption(opt.id)}
                  className={`p-6 rounded-xl border-2 text-center transition-all cursor-pointer ${
                    selectedOptions.includes(opt.id)
                      ? "border-primary bg-primary/5"
                      : "border-input hover:border-primary/40"
                  }`}
                >
                  {opt.foto && (
                    <img src={opt.foto} alt={opt.name} className="h-20 w-20 object-cover rounded-full mx-auto mb-2" />
                  )}
                  <p className="text-lg font-semibold">{opt.name}</p>
                  {opt.description && (
                    <p className="text-sm text-muted-foreground mt-1">{opt.description}</p>
                  )}
                </button>
              ))}
            </div>
          ) : isRanking ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Urutkan preferensi Anda (no. 1 = preferensi tertinggi)
              </p>
              {ranking.map((optionId, idx) => {
                const opt = options.find((o) => o.id === optionId)
                return (
                  <div
                    key={optionId}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                      {idx + 1}
                    </div>
                    {opt?.foto && (
                      <img src={opt.foto} alt={opt.name} className="h-10 w-10 rounded-lg object-cover border shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{opt?.name}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveRank(idx, "up")}
                        disabled={idx === 0}
                        className="h-7 w-7 rounded hover:bg-accent disabled:opacity-30 cursor-pointer"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveRank(idx, "down")}
                        disabled={idx === ranking.length - 1}
                        className="h-7 w-7 rounded hover:bg-accent disabled:opacity-30 cursor-pointer"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggleOption(opt.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    selectedOptions.includes(opt.id)
                      ? "border-primary bg-primary/5"
                      : "border-input hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedOptions.includes(opt.id) ? "border-primary" : "border-muted-foreground"
                      }`}
                    >
                      {selectedOptions.includes(opt.id) && (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    {opt.foto && (
                      <img src={opt.foto} alt={opt.name} className="h-12 w-12 rounded-lg object-cover border shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{opt.name}</p>
                      {opt.description && (
                        <p className="text-sm text-muted-foreground">{opt.description}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Sebelum memilih:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Pilihan Anda bersifat RAHASIA dan tidak dapat diubah setelah disubmit</li>
              <li>• Setiap anggota hanya dapat memberikan SATU suara</li>
              <li>• Suara Anda akan dicatat dengan hash kriptografi untuk verifikasi integritas</li>
              <li>• Anda akan menerima hash receipt setelah voting untuk verifikasi mandiri</li>
            </ul>
          </div>

          <Button
            size="lg"
            className="w-full h-12"
            disabled={submitting || (poll.type !== "ranking" && selectedOptions.length === 0)}
            onClick={() => setConfirmOpen(true)}
          >
            <Shield className="h-5 w-5 mr-2" />
            {isMulti
              ? `Submit ${selectedOptions.length} Pilihan`
              : "Submit Suara Saya"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogHeader>
          <DialogTitle>Konfirmasi Voting</DialogTitle>
          <DialogDescription className="block">
            <span className="block">Apakah Anda yakin dengan pilihan Anda?</span>
            <span className="block font-semibold text-destructive">
              PERHATIAN: Setelah disubmit, pilihan Anda TIDAK DAPAT DIUBAH atau dibatalkan.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmitVote} disabled={submitting}>
            {submitting ? "Memproses..." : "Ya, Submit Suara Saya"}
          </Button>
        </DialogFooter>
        <DialogClose onClick={() => setConfirmOpen(false)} />
      </Dialog>
    </div>
  )
}
