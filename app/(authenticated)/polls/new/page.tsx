"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { pollSchema } from "@/lib/validations/member"

const pollFormSchema = pollSchema.extend({
  options: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    foto: z.string().optional(),
  })).default([{ name: "", description: "" }]),
})

type PollFormData = z.input<typeof pollFormSchema>
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Select } from "@/components/ui/select"
import { ArrowLeft, Save, Plus, Trash2, Send } from "lucide-react"

const pollTypes = [
  { value: "single-choice", label: "Pilihan Tunggal" },
  { value: "multiple-choice", label: "Pilihan Ganda" },
  { value: "ranking", label: "Peringkat" },
  { value: "yes-no", label: "Ya/Tidak" },
]

const categories = [
  { value: "Pemilihan Ketua", label: "Pemilihan Ketua" },
  { value: "Pengambilan Keputusan", label: "Pengambilan Keputusan" },
  { value: "Survei", label: "Survei" },
  { value: "Lainnya", label: "Lainnya" },
]

const visibilityOptions = [
  { value: "public-after-close", label: "Publik setelah selesai" },
  { value: "public-realtime", label: "Publik real-time" },
  { value: "committee-only", label: "Hanya panitia" },
]

export default function NewPollPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [members, setMembers] = useState<{ id: string; namaLengkap: string }[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const userRole = session?.user?.roleId

  if (status === "loading") {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
  }

  if (userRole !== "role-super-admin" && userRole !== "role-election-committee") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/polls")}>Kembali</Button>
      </div>
    )
  }

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PollFormData>({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "single-choice",
      category: "Pemilihan Ketua",
      startDate: "",
      endDate: "",
      quorumPercentage: 50,
      visibility: "public-after-close",
      allowComments: true,
      randomizeOptions: false,
      isRankingPublic: true,
      options: [{ name: "", description: "", foto: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  })

  useEffect(() => {
    fetch("/api/members?pageSize=500")
      .then((res) => res.json())
      .then((data) => setMembers(data.data || []))
      .catch(() => {})
  }, [])

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  const toggleAllMembers = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(members.map((m) => m.id))
    }
  }

  const submitIntent = useRef<"draft" | "publish">("draft")

  const createPollAndOptions = async (data: PollFormData, publishNow: boolean) => {
    const res = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, status: publishNow ? "Ongoing" : "Draft" }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.details || err.error || "Gagal membuat poll")
    }
    const poll = await res.json()

    const opts = data.options ?? []
      for (let i = 0; i < opts.length; i++) {
        if (opts[i].name) {
          await fetch("/api/poll-options", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pollId: poll.id,
              name: opts[i].name,
              description: opts[i].description,
              foto: opts[i].foto || undefined,
              urutan: i + 1,
            }),
          })
        }
      }

    for (const memberId of selectedMembers) {
      await fetch("/api/poll-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pollId: poll.id,
          type: "member",
          referenceId: memberId,
        }),
      })
    }

    return poll
  }

  const onSubmit = async (data: PollFormData) => {
    const publishNow = submitIntent.current === "publish"
    submitIntent.current = "draft"

    if (publishNow) {
      if (selectedMembers.length === 0) {
        toast.error("Pilih minimal satu anggota yang eligible untuk vote")
        return
      }
      const hasName = (data.options ?? []).some((o) => o.name)
      if (!hasName) {
        toast.error("Minimal satu opsi/kandidat harus diisi")
        return
      }
      setPublishing(true)
    } else {
      setSaving(true)
    }

    try {
      const poll = await createPollAndOptions(data, publishNow)
      if (publishNow) {
        toast.success("Poll berhasil dibuat dan dipublikasi! Sekarang anggota bisa vote.")
        router.push("/polls")
      } else {
        toast.success("Poll berhasil dibuat")
        router.push(`/polls/${poll.id}/edit`)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal membuat poll")
    } finally {
      setSaving(false)
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Buat Poll Baru</h1>
          <p className="text-sm text-muted-foreground">Buat voting/polling baru untuk organisasi</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Poll</CardTitle>
            <CardDescription>Detail dasar voting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="title">Judul *</Label>
              <Input id="title" {...register("title")} />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-3">
              <Label htmlFor="description">Deskripsi</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                {...register("description")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <Label htmlFor="type">Tipe Poll</Label>
                <Select
                  id="type"
                  options={pollTypes}
                  {...register("type")}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="category">Kategori</Label>
                <Select
                  id="category"
                  options={categories}
                  {...register("category")}
                />
                {errors.category && (
                  <p className="text-xs text-destructive">{errors.category.message}</p>
                )}
              </div>
              <div className="space-y-3">
                <Label htmlFor="startDate">Tanggal Mulai *</Label>
                <Input id="startDate" type="datetime-local" {...register("startDate")} />
                {errors.startDate && (
                  <p className="text-xs text-destructive">{errors.startDate.message}</p>
                )}
              </div>
              <div className="space-y-3">
                <Label htmlFor="endDate">Tanggal Selesai *</Label>
                <Input id="endDate" type="datetime-local" {...register("endDate")} />
                {errors.endDate && (
                  <p className="text-xs text-destructive">{errors.endDate.message}</p>
                )}
              </div>
              <div className="space-y-3">
                <Label htmlFor="quorum">Kuorum (%)</Label>
                <Input id="quorum" type="number" min={1} max={100} {...register("quorumPercentage", { valueAsNumber: true })} />
                {errors.quorumPercentage && (
                  <p className="text-xs text-destructive">{errors.quorumPercentage.message}</p>
                )}
              </div>
              <div className="space-y-3">
                <Label htmlFor="visibility">Visibilitas Hasil</Label>
                <Select
                  id="visibility"
                  options={visibilityOptions}
                  {...register("visibility")}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" {...register("allowComments")} />
                <span className="text-sm">Izinkan komentar</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" {...register("randomizeOptions")} />
                <span className="text-sm">Acak urutan opsi</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opsi / Kandidat</CardTitle>
            <CardDescription>Daftar pilihan yang tersedia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, idx) => (
              <div key={field.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="flex-1 space-y-3">
                  <Input
                    placeholder="Nama opsi/kandidat"
                    {...register(`options.${idx}.name`)}
                  />
                  <Input
                    placeholder="Deskripsi (opsional)"
                    {...register(`options.${idx}.description`)}
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="URL Foto (opsional)"
                      {...register(`options.${idx}.foto`)}
                    />
                    {(field as Record<string, unknown>).foto ? (
                      <img
                        src={(field as Record<string, unknown>).foto as string}
                        alt="preview"
                        className="h-10 w-10 rounded-lg object-cover border shrink-0"
                      />
                    ) : null}
                  </div>
                </div>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(idx)} className="mt-0">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", description: "", foto: "" })} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Opsi
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eligibility Pemilih</CardTitle>
            <CardDescription>Pilih anggota yang berhak memberikan suara</CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada anggota tersedia</p>
            ) : (
              <>
                <label className="flex items-center gap-3 p-2 border-b mb-1 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={selectedMembers.length === members.length}
                    onChange={toggleAllMembers}
                  />
                  <span className="text-sm font-medium">Pilih Semua</span>
                  <span className="text-xs text-muted-foreground ml-auto">{selectedMembers.length} / {members.length}</span>
                </label>
                <div className="max-h-64 overflow-y-auto space-y-1 border rounded-lg p-2">
                  {members.map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors hover:bg-accent ${
                        selectedMembers.includes(m.id) ? "bg-primary/10" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedMembers.includes(m.id)}
                        onChange={() => toggleMember(m.id)}
                      />
                      <span className="text-sm">{m.namaLengkap}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {selectedMembers.length} anggota dipilih
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving || publishing} onClick={() => { submitIntent.current = "draft" }}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Menyimpan..." : "Simpan Poll"}
          </Button>
          <Button type="submit" disabled={saving || publishing} onClick={() => { submitIntent.current = "publish" }} className="bg-green-600 hover:bg-green-700">
            <Send className="h-4 w-4 mr-2" />
            {publishing ? "Mempublikasi..." : "Simpan & Publikasikan"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
        </div>
      </form>
    </div>
  )
}
