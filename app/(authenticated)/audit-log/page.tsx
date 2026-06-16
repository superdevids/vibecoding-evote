"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Search,
  Filter,
  History,
  ChevronDown,
} from "lucide-react"

interface AuditLogItem {
  id: string
  userId: string
  action: string
  resource: string
  resourceId: string | null
  before: string | null
  after: string | null
  ip: string | null
  createdAt: string
}

const actionColors: Record<string, "default" | "success" | "warning" | "destructive" | "info" | "secondary"> = {
  create: "success",
  update: "warning",
  delete: "destructive",
  read: "info",
  login: "default",
  logout: "secondary",
}

const actionLabels: Record<string, string> = {
  create: "Buat",
  update: "Ubah",
  delete: "Hapus",
  read: "Baca",
  login: "Login",
  logout: "Logout",
}

export default function AuditLogPage() {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })
      const res = await fetch(`/api/audit-logs?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
  })

  const logs: AuditLogItem[] = data?.data || []
  const totalPages = data?.totalPages || 1

  const filteredLogs = logs.filter((log) => {
    if (search) {
      const q = search.toLowerCase()
      if (
        !log.action.toLowerCase().includes(q) &&
        !log.resource.toLowerCase().includes(q) &&
        !(log.resourceId && log.resourceId.toLowerCase().includes(q))
      ) {
        return false
      }
    }
    if (actionFilter && log.action !== actionFilter) return false
    if (dateFrom && new Date(log.createdAt) < new Date(dateFrom)) return false
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      if (new Date(log.createdAt) > endDate) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Catatan aktivitas pengguna dalam sistem
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari action atau resource..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              options={[
                { value: "create", label: "Buat" },
                { value: "update", label: "Ubah" },
                { value: "delete", label: "Hapus" },
                { value: "read", label: "Baca" },
                { value: "login", label: "Login" },
                { value: "logout", label: "Logout" },
              ]}
              placeholder="Semua Action"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            />
            <Input
              type="date"
              className="w-full sm:w-40"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Dari tanggal"
            />
            <Input
              type="date"
              className="w-full sm:w-40"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Sampai tanggal"
            />
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Tidak ada data audit log
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.userId.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionColors[log.action] || "default"}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium">{log.resource}</span>
                      {log.resourceId && (
                        <span className="text-muted-foreground text-xs ml-1">
                          #{log.resourceId.slice(0, 8)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
