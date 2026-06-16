"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Select } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  Plus,
  Search,
  Users,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  UserCog,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Eye,
  Clock,
} from "lucide-react"

interface UserItem {
  id: string
  email: string
  username: string
  roleId: string
  roleName: string
  isActive: boolean
  mustChangePassword: boolean
  lastLoginAt: string | null
  createdAt: string
}

interface Role {
  id: string
  name: string
}

export default function UsersPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [createDialog, setCreateDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [editRoleDialog, setEditRoleDialog] = useState<{ id: string; currentRoleId: string } | null>(null)
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    roleId: "",
  })

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" })
      if (search) params.set("search", search)
      const res = await fetch(`/api/users?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
  })

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await fetch("/api/roles")
      if (!res.ok) throw new Error("Failed to fetch roles")
      return res.json()
    },
  })

  const users: UserItem[] = usersData?.data || []
  const roles: Role[] = rolesData?.data || rolesData || []
  const totalPages = usersData?.totalPages || 1
  const isSuperAdmin = session?.user?.roleId === "super-admin"

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("User berhasil dibuat")
      setCreateDialog(false)
      setForm({ email: "", username: "", password: "", roleId: "" })
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (!res.ok) throw new Error("Failed to toggle")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Status user diubah")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: () => toast.error("Gagal mengubah status"),
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, roleId }: { id: string; roleId: string }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      })
      if (!res.ok) throw new Error("Failed to update role")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Role user diubah")
      setEditRoleDialog(null)
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: () => toast.error("Gagal mengubah role"),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSuccess: () => {
      toast.success("User berhasil dihapus")
      setDeleteDialog(null)
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: () => toast.error("Gagal menghapus user"),
  })

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <h2 className="text-lg font-medium">Akses Ditolak</h2>
        <p className="text-sm text-muted-foreground mt-1">Halaman ini hanya untuk Super Admin</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manajemen User</h1>
          <p className="text-sm text-muted-foreground">
            Kelola akun pengguna sistem ({usersData?.total || 0} total)
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah User
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari username, email, role..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && queryClient.invalidateQueries({ queryKey: ["users"] })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Tidak ada data user
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                        {user.username}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="info" className="text-xs">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {user.roleName || user.roleId}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "success" : "destructive"}>
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {user.lastLoginAt ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(user.lastLoginAt).toLocaleString("id-ID")}
                        </span>
                      ) : (
                        <span className="italic">Belum pernah login</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent cursor-pointer">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditRoleDialog({ id: user.id, currentRoleId: user.roleId })}
                        >
                          <Shield className="h-4 w-4" />
                          Ubah Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleActiveMutation.mutate({ id: user.id, isActive: user.isActive })}
                        >
                          {user.isActive ? (
                            <ToggleLeft className="h-4 w-4" />
                          ) : (
                            <ToggleRight className="h-4 w-4" />
                          )}
                          {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteDialog(user.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="text-destructive">Hapus</span>
                        </DropdownMenuItem>
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
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Sebelumnya
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogHeader>
          <DialogTitle>Tambah User Baru</DialogTitle>
          <DialogDescription>Buat akun pengguna untuk akses sistem</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-3">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="username"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 6 karakter"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="role">Role *</Label>
            <Select
              id="role"
              options={(Array.isArray(roles) ? roles : []).map((r: Role) => ({
                value: r.id,
                label: r.name,
              }))}
              placeholder="Pilih role"
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateDialog(false)}>Batal</Button>
          <Button
            onClick={() => {
              if (!form.username || !form.email || !form.password || !form.roleId) {
                toast.error("Semua field wajib diisi")
                return
              }
              createMutation.mutate(form)
            }}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
        <DialogClose onClick={() => setCreateDialog(false)} />
      </Dialog>

      <Dialog open={!!editRoleDialog} onOpenChange={() => setEditRoleDialog(null)}>
        <DialogHeader>
          <DialogTitle>Ubah Role User</DialogTitle>
          <DialogDescription>Pilih role baru untuk pengguna ini</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select
            options={(Array.isArray(roles) ? roles : []).map((r: Role) => ({
              value: r.id,
              label: r.name,
            }))}
            value={editRoleDialog?.currentRoleId || ""}
            onChange={(e) =>
              editRoleDialog &&
              setEditRoleDialog({ ...editRoleDialog, currentRoleId: e.target.value })
            }
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditRoleDialog(null)}>Batal</Button>
          <Button
            onClick={() => {
              if (editRoleDialog) {
                updateRoleMutation.mutate({
                  id: editRoleDialog.id,
                  roleId: editRoleDialog.currentRoleId,
                })
              }
            }}
            disabled={updateRoleMutation.isPending}
          >
            Simpan
          </Button>
        </DialogFooter>
        <DialogClose onClick={() => setEditRoleDialog(null)} />
      </Dialog>

      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogHeader>
          <DialogTitle>Hapus User</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteDialog(null)}>Batal</Button>
          <Button
            variant="destructive"
            onClick={() => deleteDialog && deleteMutation.mutate(deleteDialog)}
            disabled={deleteMutation.isPending}
          >
            Hapus
          </Button>
        </DialogFooter>
        <DialogClose onClick={() => setDeleteDialog(null)} />
      </Dialog>
    </div>
  )
}
