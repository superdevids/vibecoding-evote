"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, Clock } from "lucide-react"
import type { PollType } from "@/lib/types"

interface PollPreviewOption {
  id: string
  name: string
  description?: string
  urutan: number
}

interface PollPreviewData {
  id: string
  title: string
  description: string
  type: PollType
  status: string
  startDate: string
  endDate: string
}

interface PollPreviewProps {
  poll: PollPreviewData
  options: PollPreviewOption[]
}

const typeBadge: Record<string, { label: string; variant: "default" | "secondary" | "info" | "warning" }> = {
  "single-choice": { label: "Pilihan Tunggal", variant: "default" },
  "multiple-choice": { label: "Pilihan Ganda", variant: "secondary" },
  ranking: { label: "Urutan Preferensi", variant: "info" },
  "yes-no": { label: "Ya / Tidak", variant: "warning" },
}

export function PollPreview({ poll, options }: PollPreviewProps) {
  const badge = typeBadge[poll.type] || { label: poll.type, variant: "default" as const }
  const isYesNo = poll.type === "yes-no"
  const isRanking = poll.type === "ranking"
  const isMulti = poll.type === "multiple-choice"

  const timeLeft = new Date(poll.endDate).getTime() - Date.now()
  const daysLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24)))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{poll.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {daysLeft > 0 && (
              <Badge variant="info">{daysLeft} hari tersisa</Badge>
            )}
          </div>
        </div>
        <CardDescription>{poll.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isYesNo ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {options.map((opt) => (
              <button
                key={opt.id}
                className="p-6 rounded-xl border-2 border-input text-center transition-all cursor-default"
                disabled
              >
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
            {options.map((opt, idx) => (
              <div
                key={opt.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{opt.name}</p>
                </div>
                <div className="flex gap-1">
                  <button className="h-7 w-7 rounded hover:bg-accent disabled:opacity-30 cursor-default" disabled>
                    ↑
                  </button>
                  <button className="h-7 w-7 rounded hover:bg-accent disabled:opacity-30 cursor-default" disabled>
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {options.map((opt) => (
              <button
                key={opt.id}
                className="w-full p-4 rounded-xl border-2 border-input text-left transition-all cursor-default"
                disabled
              >
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                    {isMulti && <div className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/30" />}
                  </div>
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

        <Button size="lg" className="w-full h-12" disabled>
          <Shield className="h-5 w-5 mr-2" />
          {isMulti ? "Submit Pilihan" : "Submit Suara Saya"}
        </Button>
      </CardContent>
    </Card>
  )
}
