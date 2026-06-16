"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { MessageSquare } from "lucide-react"
import type { Poll } from "@/lib/types"

export default function DiscussionsPage() {
  const router = useRouter()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/polls")
      .then((r) => r.json())
      .then((d) => setPolls(d.data?.filter((p: Poll) => p.allowComments) || []))
      .catch(() => toast.error("Gagal memuat"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Diskusi</h1>
        <p className="text-sm text-muted-foreground">Forum diskusi per polling</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : polls.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Belum ada diskusi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {polls.map((poll) => (
            <Card
              key={poll.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/polls/${poll.id}/discuss`)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{poll.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={poll.status === "Ongoing" ? "success" : "default"}>
                  {poll.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
