"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { FileBarChart, Download, FileText, Table2 } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Laporan</h1>
        <p className="text-sm text-muted-foreground">Generate berita acara, rekap hasil, dan ekspor data</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = "/results"}>
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold">Berita Acara PDF</h3>
            <p className="text-sm text-muted-foreground mt-1">Generate berita acara hasil voting</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = "/api/export?type=csv"}>
          <CardContent className="p-6 text-center">
            <Table2 className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold">Ekspor CSV/Excel</h3>
            <p className="text-sm text-muted-foreground mt-1">Rekap hasil dan partisipasi</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = "/audit-log"}>
          <CardContent className="p-6 text-center">
            <FileBarChart className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold">Audit Log</h3>
            <p className="text-sm text-muted-foreground mt-1">Riwayat aktivitas sistem</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
