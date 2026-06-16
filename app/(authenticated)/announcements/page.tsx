"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Megaphone, Pin } from "lucide-react"

interface Announcement {
  id: string
  title: string
  content: string
  isPinned: boolean
  createdAt: string
}

export default function AnnouncementsPage() {
  const [data, setData] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((d) => setData(d.data || []))
      .catch(() => toast.error("Gagal memuat"))
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...data].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="space-y-6 max-w-3xl px-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pengumuman</h1>
        <p className="text-sm text-muted-foreground">Informasi dan pengumuman organisasi</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Megaphone className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Belum ada pengumuman</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((item) => (
            <Card key={item.id} className={item.isPinned ? "border-primary/30" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start gap-2">
                  {item.isPinned && <Pin className="h-4 w-4 text-primary shrink-0 mt-1" />}
                  <div className="flex-1">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.createdAt).toLocaleDateString("id-ID", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </p>
                  </div>
                  {item.isPinned && <Badge variant="default" className="text-xs">Pinned</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{item.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
