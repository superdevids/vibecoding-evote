"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Users,
  Filter,
  ChevronDown,
  ArrowUpDown,
  Download,
  Upload,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Select } from "@/components/ui/select"
import { useSession } from "next-auth/react"

interface Member {
  id: string
  namaLengkap: string
  nomorAnggota: string
  email: string
  organizationUnitId: string
  status: string
  verificationStatus: string
  createdAt: string
}

const statusColors: Record<string, "success" | "warning" | "destructive"> = {
  Aktif: "success",
  Nonaktif: "warning",
  Suspended: "destructive",
}

const verificationLabels: Record<string, string> = {
  belum: "Belum",
  sudah: "Sudah",
  expired: "Kadaluarsa",
}

const verificationColors: Record<string, "warning" | "success" | "destructive"> = {
  belum: "warning",
  sudah: "success",
  expired: "destructive",
}

export default function MembersPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const userRole = session?.user?.roleId
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [sortField, setSortField] = useState("createdAt")
  const [sortDir, setSortDir] = useState("desc")

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
        sortField,
        sortDir,
      })
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)

      const res = await fetch(`/api/members?${params}`)
      const data = await res.json()
      setMembers(data.data)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      toast.error("Gagal memuat data anggota")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [page, statusFilter, sortField, sortDir])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Anggota berhasil dihapus")
      setDeleteDialog(null)
      fetchMembers()
    } catch {
      toast.error("Gagal menghapus anggota")
    }
  }

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Anggota</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data anggota organisasi ({total} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userRole === "role-super-admin" && (
            <Button variant="outline" size="sm" onClick={() => toast.info("Fitur import dalam pengembangan")}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
          )}
          {userRole === "role-super-admin" && (
            <Button size="sm" onClick={() => router.push("/members/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Anggota
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, nomor anggota, email..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchMembers()}
              />
            </div>
            <Select
              placeholder="Semua Status"
              options={[
                { value: "Aktif", label: "Aktif" },
                { value: "Nonaktif", label: "Nonaktif" },
                { value: "Suspended", label: "Suspended" },
              ]}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="w-full sm:w-48"
            />
            <Button variant="outline" size="sm" onClick={fetchMembers}>
              <Filter className="h-4 w-4 mr-2" />
              Cari
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("nomorAnggota")}>
                  <span className="flex items-center gap-1">
                    No. Anggota
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("namaLengkap")}>
                  <span className="flex items-center gap-1">
                    Nama Lengkap
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verifikasi</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("createdAt")}>
                  <span className="flex items-center gap-1">
                    Bergabung
                    <ArrowUpDown className="h-3 w-3" />
                  </span>
                </TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Tidak ada data anggota
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow
                    key={member.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/members/${member.id}`)}
                  >
                    <TableCell className="font-mono text-xs">{member.nomorAnggota}</TableCell>
                    <TableCell className="font-medium">{member.namaLengkap}</TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[member.status] || "default"}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={verificationColors[member.verificationStatus] || "default"}>
                        {verificationLabels[member.verificationStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(member.createdAt).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/members/${member.id}`)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                          Detail
                        </DropdownMenuItem>
                        {userRole === "role-super-admin" || userRole === "role-election-committee" ? (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/members/${member.id}/edit`)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        {userRole === "role-super-admin" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteDialog(member.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="text-destructive">Hapus</span>
                          </DropdownMenuItem>
                        )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogHeader>
          <DialogTitle>Hapus Anggota</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus anggota ini? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteDialog(null)}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteDialog && handleDelete(deleteDialog)}
          >
            Hapus
          </Button>
        </DialogFooter>
        <DialogClose onClick={() => setDeleteDialog(null)} />
      </Dialog>
    </div>
  )
}
