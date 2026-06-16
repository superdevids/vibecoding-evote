"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { ArrowLeft, Mail, Phone, Building2, BadgeCheck, Calendar, Pencil, Trash2 } from "lucide-react"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"

interface MemberDetail {
  id: string
  namaLengkap: string
  nomorAnggota: string
  email: string
  noHP?: string
  organizationUnitId: string
  jabatan?: string
  status: string
  verificationStatus: string
  nik?: string
  tanggalBergabung: string
  createdAt: string
  updatedAt: string
}

const statusColors: Record<string, "success" | "warning" | "destructive"> = {
  Aktif: "success",
  Nonaktif: "warning",
  Suspended: "destructive",
}

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [member, setMember] = useState<MemberDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState(false)

  useEffect(() => {
    fetch(`/api/members/${params.id}`)
      .then((r) => r.json())
      .then((data) => setMember(data))
      .catch(() => toast.error("Gagal memuat data anggota"))
      .finally(() => setLoading(false))
  }, [params.id])

  const handleDelete = async () => {
    try {
      await fetch(`/api/members/${params.id}`, { method: "DELETE" })
      toast.success("Anggota berhasil dihapus")
      router.push("/members")
    } catch {
      toast.error("Gagal menghapus anggota")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Anggota tidak ditemukan</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/members")}>
          Kembali
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-20 w-20 text-xl"><AvatarFallback>{member.namaLengkap.charAt(0)}</AvatarFallback></Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold">{member.namaLengkap}</h2>
                <Badge variant={statusColors[member.status]}>{member.status}</Badge>
              </div>
              <p className="font-mono text-sm text-muted-foreground">{member.nomorAnggota}</p>
              <p className="text-sm text-muted-foreground">
                {member.jabatan || "Anggota"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push(`/members/${member.id}/edit`)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Kontak</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{member.email}</p>
                <p className="text-xs text-muted-foreground">Email</p>
              </div>
            </div>
            {member.noHP && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{member.noHP}</p>
                  <p className="text-xs text-muted-foreground">No. HP</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Organisasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Unit Organisasi</p>
                <p className="text-xs text-muted-foreground">{member.organizationUnitId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Bergabung</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(member.tanggalBergabung).toLocaleDateString("id-ID")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verifikasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Status Verifikasi</p>
                <Badge variant={member.verificationStatus === "sudah" ? "success" : "warning"}>
                  {member.verificationStatus === "sudah" ? "Terverifikasi" : "Belum Verifikasi"}
                </Badge>
              </div>
            </div>
            {member.nik && (
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">NIK</p>
                  <p className="text-xs text-muted-foreground font-mono">{member.nik}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogHeader>
          <DialogTitle>Hapus Anggota</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus {member?.namaLengkap}?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteDialog(false)}>Batal</Button>
          <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
        </DialogFooter>
        <DialogClose onClick={() => setDeleteDialog(false)} />
      </Dialog>
    </div>
  )
}
