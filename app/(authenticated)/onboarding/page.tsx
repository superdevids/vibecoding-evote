"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { toast } from "sonner"
import { Save, Upload, Info, CheckCircle2 } from "lucide-react"

interface OrgUnit {
  id: string
  name: string
}

interface MemberProfile {
  id: string
  namaLengkap: string
  fotoProfil: string | null
  organizationUnitId: string
  jabatan: string | null
  nik: string | null
  verificationStatus: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    organizationUnitId: "",
    nik: "",
    jabatan: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const { data: orgUnits } = useQuery<OrgUnit[]>({
    queryKey: ["organization-units"],
    queryFn: async () => {
      const res = await fetch("/api/organization-units")
      const d = await res.json()
      return d.data || d
    },
  })

  const { data: profile, isLoading: profileLoading } = useQuery<MemberProfile>({
    queryKey: ["member-profile", session?.user?.memberId],
    queryFn: async () => {
      if (!session?.user?.memberId) return null
      const res = await fetch(`/api/members/${session.user.memberId}`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!session?.user?.memberId,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      let fotoProfil = profile?.fotoProfil

      if (file) {
        setUploading(true)
        const formData = new FormData()
        formData.append("file", file)
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          fotoProfil = uploadData.url
        }
        setUploading(false)
      }

      if (!session?.user?.memberId) return

      const res = await fetch(`/api/members/${session.user.memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationUnitId: form.organizationUnitId || profile?.organizationUnitId,
          nik: form.nik || profile?.nik,
          jabatan: form.jabatan || profile?.jabatan,
          fotoProfil,
          verificationStatus: "sudah",
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Profil berhasil dilengkapi")
      queryClient.invalidateQueries({ queryKey: ["member-profile"] })
      update()
      router.push("/dashboard")
    },
    onError: () => {
      toast.error("Gagal menyimpan profil")
    },
  })

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Selamat Datang!</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lengkapi profil Anda sebelum melanjutkan
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lengkapi Profil</CardTitle>
          <CardDescription>
            Data berikut diperlukan untuk verifikasi anggota
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Foto Profil</Label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/30">
                {file ? (
                  <img src={URL.createObjectURL(file)} alt="Preview" className="h-full w-full object-cover" />
                ) : profile?.fotoProfil ? (
                  <img src={profile.fotoProfil} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("foto-upload")?.click()}
                >
                  Pilih Foto
                </Button>
                <input
                  id="foto-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground mt-1">Format: JPG, PNG. Maks 2MB</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="organizationUnitId">Unit Organisasi</Label>
            <Select
              id="organizationUnitId"
              options={(orgUnits || []).map((u: OrgUnit) => ({ value: u.id, label: u.name }))}
              placeholder="Pilih unit organisasi"
              value={form.organizationUnitId || profile?.organizationUnitId || ""}
              onChange={(e) => setForm({ ...form, organizationUnitId: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="nik">NIK</Label>
              <Input
                id="nik"
                placeholder="Nomor Induk Kependudukan"
                value={form.nik || profile?.nik || ""}
                onChange={(e) => setForm({ ...form, nik: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="jabatan">Jabatan</Label>
              <Input
                id="jabatan"
                placeholder="Jabatan di organisasi"
                value={form.jabatan || profile?.jabatan || ""}
                onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
              />
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || uploading}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Menyimpan..." : "Simpan & Lanjutkan"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Informasi Pemungutan Suara
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>Setiap anggota hanya dapat memberikan satu suara per polling.</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>Suara Anda akan dienkripsi dan dicatat dalam sistem blockchain untuk memastikan integritas.</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>Pastikan Anda telah membaca deskripsi setiap polling sebelum memberikan suara.</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>Hasil voting dapat diverifikasi secara mandiri melalui fitur verifikasi integritas.</span>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>Jika mengalami kendala, hubungi panitia pemilihan melalui fitur diskusi atau pengumuman.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
