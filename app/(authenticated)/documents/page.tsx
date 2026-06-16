"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { FileText, Download, CheckCircle2, AlertTriangle } from "lucide-react"

interface Document {
  id: string
  title: string
  description?: string
  category: string
  isRequired: boolean
  acknowledgedBy: string[]
  createdAt: string
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((d) => setDocs(d.data || []))
      .catch(() => toast.error("Gagal memuat"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dokumen Organisasi</h1>
        <p className="text-sm text-muted-foreground">AD/ART, tata tertib, dan dokumen lainnya</p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Belum ada dokumen</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {docs.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <CardTitle className="text-base">{doc.title}</CardTitle>
                  </div>
                  {doc.isRequired && <Badge variant="warning">Wajib</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {doc.description && (
                  <p className="text-sm text-muted-foreground">{doc.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">{doc.category}</Badge>
                  <Button variant="outline" size="sm" onClick={() => toast.info("Fitur unduh tersedia")}>
                    <Download className="h-4 w-4 mr-2" />
                    Unduh
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
