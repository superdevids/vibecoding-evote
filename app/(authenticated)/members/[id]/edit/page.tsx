"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { memberSchema } from "@/lib/validations/member"
import { z } from "zod"
type MemberFormValues = z.input<typeof memberSchema>
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ArrowLeft, Save } from "lucide-react"
import { Select } from "@/components/ui/select"

interface OrgUnit {
  id: string
  name: string
}

export default function EditMemberPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])
  const [notFound, setNotFound] = useState(false)
  const { data: session, status } = useSession()
  const userRole = session?.user?.roleId

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [orgRes, memberRes] = await Promise.all([
          fetch("/api/organization-units"),
          fetch(`/api/members/${params.id}`),
        ])

        if (!memberRes.ok) {
          if (memberRes.status === 404) setNotFound(true)
          else throw new Error()
          return
        }

        const orgData = await orgRes.json()
        setOrgUnits(orgData.data || orgData)

        const member = await memberRes.json()
        reset({
          namaLengkap: member.namaLengkap || "",
          email: member.email || "",
          noHP: member.noHP || "",
          organizationUnitId: member.organizationUnitId || "",
          jabatan: member.jabatan || "",
          nik: member.nik || "",
          status: member.status || "Aktif",
        })
      } catch {
        toast.error("Gagal memuat data anggota")
      } finally {
        setPageLoading(false)
      }
    }
    load()
  }, [params.id, reset])

  const onSubmit = async (data: MemberFormValues) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/members/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success("Data anggota berhasil diperbarui")
      router.push(`/members/${params.id}`)
    } catch {
      toast.error("Gagal memperbarui data anggota")
    } finally {
      setLoading(false)
    }
  }

  if (status !== "loading" && userRole !== "role-super-admin" && userRole !== "role-election-committee") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/members")}>Kembali</Button>
      </div>
    )
  }

  if (pageLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (notFound) {
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
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Anggota</h1>
          <p className="text-sm text-muted-foreground">
            Perbarui data anggota organisasi
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Pribadi</CardTitle>
          <CardDescription>Informasi dasar anggota</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="namaLengkap">Nama Lengkap *</Label>
                <Input id="namaLengkap" {...register("namaLengkap")} />
                {errors.namaLengkap && (
                  <p className="text-xs text-destructive">{errors.namaLengkap.message}</p>
                )}
              </div>
              <div className="space-y-3">
                <Label htmlFor="nik">NIK/Nomor Anggota</Label>
                <Input id="nik" {...register("nik")} />
              </div>
              <div className="space-y-3">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-3">
                <Label htmlFor="noHP">No. HP</Label>
                <Input id="noHP" {...register("noHP")} />
              </div>
              <div className="space-y-3">
                <Label htmlFor="organizationUnitId">Unit Organisasi</Label>
                <Select
                  id="organizationUnitId"
                  placeholder="Pilih unit"
                  options={orgUnits.map((u) => ({ value: u.id, label: u.name }))}
                  {...register("organizationUnitId")}
                />
                {errors.organizationUnitId && (
                  <p className="text-xs text-destructive">{errors.organizationUnitId.message}</p>
                )}
              </div>
              <div className="space-y-3">
                <Label htmlFor="jabatan">Jabatan</Label>
                <Input id="jabatan" {...register("jabatan")} />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-3 max-w-xs">
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  options={[
                    { value: "Aktif", label: "Aktif" },
                    { value: "Nonaktif", label: "Nonaktif" },
                    { value: "Suspended", label: "Suspended" },
                  ]}
                  {...register("status")}
                />
                {errors.status && (
                  <p className="text-xs text-destructive">{errors.status.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
