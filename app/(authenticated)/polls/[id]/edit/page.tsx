"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { pollSchema } from "@/lib/validations/member"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Select } from "@/components/ui/select"
import { ArrowLeft, Save, Plus, Trash2, Send, XCircle } from "lucide-react"
import type { Poll, PollOption } from "@/lib/types"

const pollFormSchema = pollSchema.extend({
  options: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    foto: z.string().optional(),
  })).default([{ name: "", description: "", foto: "" }]),
})

type PollFormData = z.input<typeof pollFormSchema>

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

export default function EditPollPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pollStatus, setPollStatus] = useState<string>("")
  const [publishing, setPublishing] = useState(false)
  const [closing, setClosing] = useState(false)

  // Eligibility state
  const [members, setMembers] = useState<{ id: string; namaLengkap: string }[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const { data: session, status } = useSession()
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
    reset,
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
      options: [{ name: "", description: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "options",
  })

  useEffect(() => {
    async function loadPoll() {
      try {
        const [pollRes, optionsRes, membersRes, eligibilityRes] = await Promise.all([
          fetch(`/api/polls/${params.id}`),
          fetch(`/api/poll-options?pollId=${params.id}`),
          fetch("/api/members?pageSize=500"),
          fetch(`/api/poll-eligibility?pollId=${params.id}`),
        ])

        if (!pollRes.ok) throw new Error("Poll not found")

        const poll: Poll = await pollRes.json()
        setPollStatus(poll.status)
        const optionsData = await optionsRes.json()
        const options: PollOption[] = optionsData.data || []

        reset({
          title: poll.title,
          description: poll.description || "",
          type: poll.type,
          category: poll.category,
          startDate: poll.startDate.slice(0, 16),
          endDate: poll.endDate.slice(0, 16),
          quorumPercentage: poll.quorumPercentage,
          visibility: poll.visibility,
          allowComments: poll.allowComments,
          randomizeOptions: poll.randomizeOptions,
          isRankingPublic: poll.isRankingPublic,
          options: options.length > 0
            ? options.map((o) => ({ name: o.name, description: o.description || "", foto: (o as unknown as Record<string, unknown>).foto as string || "" }))
            : [{ name: "", description: "", foto: "" }],
        })

        // Load members for eligibility
        const membersData = await membersRes.json()
        setMembers(membersData.data || [])

        // Load existing eligibility
        const eligibilityData = await eligibilityRes.json()
        const eligData = eligibilityData.data || eligibilityData || []
        const memberIds = eligData
          .filter((e: { type: string }) => e.type === "member")
          .map((e: { referenceId: string }) => e.referenceId)
        setSelectedMembers(memberIds)
      } catch {
        toast.error("Gagal memuat data poll")
        router.push("/polls")
      } finally {
        setLoading(false)
      }
    }

    loadPoll()
  }, [params.id, reset, router])

  const onSubmit = async (data: PollFormData) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/polls/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          options: (data.options ?? []).filter((o) => o.name),
          eligibility: selectedMembers.map((memberId) => ({
            type: "member",
            referenceId: memberId,
          })),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.details || err.error || "Gagal memperbarui poll")
      }
      toast.success("Poll berhasil diperbarui")
      router.push("/polls")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memperbarui poll")
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    const formData = document.querySelector("form")
    if (formData) {
      const title = (document.getElementById("title") as HTMLInputElement)?.value
      const startDate = (document.getElementById("startDate") as HTMLInputElement)?.value
      const endDate = (document.getElementById("endDate") as HTMLInputElement)?.value
      
      if (!title || title.length < 5) {
        toast.error("Judul minimal 5 karakter")
        return
      }
      if (!startDate || !endDate) {
        toast.error("Tanggal mulai dan selesai wajib diisi")
        return
      }
      if (new Date(startDate) >= new Date(endDate)) {
        toast.error("Tanggal selesai harus setelah tanggal mulai")
        return
      }

      // Check at least one option has a name
      const optionInputs = document.querySelectorAll<HTMLInputElement>('[name^="options."][name$=".name"]')
      const hasOption = Array.from(optionInputs).some((inp) => inp.value.trim())
      if (!hasOption) {
        toast.error("Minimal satu opsi/kandidat harus diisi")
        return
      }

      if (selectedMembers.length === 0) {
        toast.error("Pilih minimal satu anggota yang eligible untuk vote")
        return
      }
    }

    setPublishing(true)
    try {
      const res = await fetch(`/api/polls/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Ongoing" }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal mempublikasi poll")
      }
      toast.success("Poll berhasil dipublikasi! Sekarang anggota bisa vote.")
      setPollStatus("Ongoing")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mempublikasi poll")
    } finally {
      setPublishing(false)
    }
  }

  const handleClose = async () => {
    setClosing(true)
    try {
      const res = await fetch(`/api/polls/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Closed" }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal menutup poll")
      }
      toast.success("Poll ditutup. Hasil bisa dilihat sekarang.")
      setPollStatus("Closed")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menutup poll")
    } finally {
      setClosing(false)
    }
  }

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

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
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
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Edit Poll</h1>
          <p className="text-sm text-muted-foreground">Perbarui voting/polling yang sudah ada</p>
        </div>
        <div className="flex items-center gap-2">
          {(pollStatus === "Closed" || pollStatus === "Cancelled") && (
            <Badge variant={pollStatus === "Closed" ? "default" : "warning"} className="text-sm px-3 py-1">
              {pollStatus === "Closed" ? "Selesai" : "Dibatalkan"}
            </Badge>
          )}
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

        {pollStatus === "Draft" && (
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
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving || publishing || closing}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
          {pollStatus === "Draft" && (
            <Button type="button" onClick={handlePublish} disabled={publishing || saving} className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-2" />
              {publishing ? "Mempublikasi..." : "Publikasikan"}
            </Button>
          )}
          {pollStatus === "Ongoing" && (
            <Button type="button" onClick={handleClose} disabled={closing || saving} variant="destructive">
              <XCircle className="h-4 w-4 mr-2" />
              {closing ? "Menutup..." : "Tutup Voting"}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => router.push("/polls")}>Batal</Button>
        </div>
      </form>
    </div>
  )
}
