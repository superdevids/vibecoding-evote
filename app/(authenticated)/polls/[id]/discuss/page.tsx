"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { ArrowLeft, MessageSquare, Send, Clock, Shield } from "lucide-react"
import type { Poll } from "@/lib/types"

interface CommentData {
  id: string
  pollId: string
  memberId: string
  content: string
  createdAt: string
  parentId?: string
  memberName?: string
}

export default function DiscussPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [comments, setComments] = useState<CommentData[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [pollRes, commentsRes] = await Promise.all([
          fetch(`/api/polls/${params.id}`),
          fetch(`/api/comments?pollId=${params.id}`),
        ])
        const pollData: Poll = await pollRes.json()
        setPoll(pollData)
        const commentsData = await commentsRes.json()
        const items: CommentData[] = commentsData.data || commentsData || []

        const withNames = await Promise.all(
          items.map(async (c) => {
            try {
              const memberRes = await fetch(`/api/members/${c.memberId}`)
              const member = await memberRes.json()
              return { ...c, memberName: member.namaLengkap || "Anggota" }
            } catch {
              return { ...c, memberName: "Anggota" }
            }
          })
        )
        setComments(withNames)
      } catch {
        toast.error("Gagal memuat diskusi")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId: params.id, content: newComment.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal mengirim komentar")
      }
      const created = await res.json()
      const memberName = session?.user?.name || "Anggota"
      setComments((prev) => [
        ...prev,
        { ...created, memberName },
      ])
      setNewComment("")
      toast.success("Komentar terkirim")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengirim komentar")
    } finally {
      setSubmitting(false)
    }
  }

  const rootComments = comments.filter((c) => !c.parentId)

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Poll tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/discussions")}>Kembali</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/discussions")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{poll.title}</CardTitle>
            <Badge variant={poll.status === "Ongoing" ? "success" : "default"}>
              {poll.status === "Ongoing" ? "Berlangsung" : poll.status === "Closed" ? "Selesai" : poll.status}
            </Badge>
          </div>
          {poll.description && (
            <p className="text-sm text-muted-foreground mt-1">{poll.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(poll.startDate).toLocaleDateString("id-ID")} - {new Date(poll.endDate).toLocaleDateString("id-ID")}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {comments.length} komentar
            </span>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {rootComments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">Belum ada diskusi. Jadilah yang pertama berkomentar!</p>
            </CardContent>
          </Card>
        ) : (
          rootComments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{comment.memberName?.charAt(0) || "A"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{comment.memberName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString("id-ID", {
                          year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {poll.allowComments !== false ? (
        poll.status === "Ongoing" ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <textarea
                  className="flex-1 min-h-[60px] rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  placeholder="Tulis komentar Anda..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
              </div>
              <div className="flex justify-end mt-3">
                <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim() || submitting}>
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Mengirim..." : "Kirim"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-muted/30">
            <CardContent className="text-center py-6">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                {poll.status === "Draft" ? "Diskusi belum dimulai. Tunggu hingga polling memasuki masa voting." :
                 poll.status === "Closed" ? "Masa diskusi telah berakhir. Polling sudah ditutup." :
                 poll.status === "Cancelled" ? "Polling ini dibatalkan." :
                 "Diskusi hanya tersedia saat voting berlangsung."}
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="bg-muted/30">
          <CardContent className="text-center py-6">
            <MessageSquare className="h-6 w-6 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">Diskusi tidak diaktifkan untuk polling ini.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
