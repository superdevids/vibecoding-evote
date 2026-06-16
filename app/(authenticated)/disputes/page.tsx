"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle2, XCircle, Scale } from "lucide-react"

interface DisputeItem {
  id: string
  userId: string
  pollId: string
  memberId: string
  reason: string
  status: "pending" | "resolved"
  resolution?: string
  resolutionNote?: string
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
}

export default function DisputesPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState("")
  const [resolveDialog, setResolveDialog] = useState<DisputeItem | null>(null)
  const [resolutionNote, setResolutionNote] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["disputes"],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      const res = await fetch(`/api/disputes?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
  })

  const resolveMutation = useMutation({
    mutationFn: async ({
      id,
      resolution,
      resolutionNote,
    }: {
      id: string
      resolution: "accepted" | "rejected"
      resolutionNote: string
    }) => {
      const res = await fetch("/api/disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, resolution, resolutionNote }),
      })
      if (!res.ok) throw new Error("Failed to resolve")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Dispute berhasil diresolusi")
      queryClient.invalidateQueries({ queryKey: ["disputes"] })
      setResolveDialog(null)
      setResolutionNote("")
    },
    onError: () => {
      toast.error("Gagal meresolusi dispute")
    },
  })

  const disputes: DisputeItem[] = data?.data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dispute & Koreksi Suara</h1>
        <p className="text-sm text-muted-foreground">
          Kelola sengketa dan koreksi suara dari anggota
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Select
              options={[
                { value: "pending", label: "Pending" },
                { value: "resolved", label: "Resolved" },
              ]}
              placeholder="Semua Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Poll ID</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : disputes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Tidak ada data dispute
                  </TableCell>
                </TableRow>
              ) : (
                disputes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {d.pollId.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {d.memberId?.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {d.reason}
                    </TableCell>
                    <TableCell>
                      {d.status === "pending" ? (
                        <Badge variant="warning">Pending</Badge>
                      ) : d.resolution === "accepted" ? (
                        <Badge variant="success">Diterima</Badge>
                      ) : (
                        <Badge variant="destructive">Ditolak</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(d.createdAt).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right">
                      {d.status === "pending" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setResolveDialog(d)
                            setResolutionNote("")
                          }}
                        >
                          Resolusi
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {d.resolutionNote}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!resolveDialog} onOpenChange={(open) => !open && setResolveDialog(null)}>
        {resolveDialog && (
          <>
            <DialogHeader>
              <DialogTitle>Resolusi Dispute</DialogTitle>
              <DialogDescription className="space-y-3">
                <div className="bg-muted rounded-lg p-3 space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Alasan:</span> {resolveDialog.reason}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Poll: {resolveDialog.pollId} &middot; Member: {resolveDialog.memberId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Catatan Resolusi</label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    placeholder="Tambahkan catatan..."
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                  />
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setResolveDialog(null)}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  resolveMutation.mutate({
                    id: resolveDialog.id,
                    resolution: "rejected",
                    resolutionNote,
                  })
                }
                disabled={resolveMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Tolak
              </Button>
              <Button
                onClick={() =>
                  resolveMutation.mutate({
                    id: resolveDialog.id,
                    resolution: "accepted",
                    resolutionNote,
                  })
                }
                disabled={resolveMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Terima
              </Button>
            </DialogFooter>
            <DialogClose onClick={() => setResolveDialog(null)} />
          </>
        )}
      </Dialog>
    </div>
  )
}
