"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Building2, Plus } from "lucide-react"

interface OrgUnit {
  id: string
  name: string
  description?: string
  parentId?: string
  isActive: boolean
}

export default function OrgUnitsPage() {
  const { data: session } = useSession()
  const userRole = session?.user?.roleId
  const [units, setUnits] = useState<OrgUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")

  useEffect(() => {
    fetch("/api/organization-units")
      .then((r) => r.json())
      .then((d) => setUnits(d.data || d))
      .catch(() => toast.error("Gagal memuat"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Unit Organisasi</h1>
          <p className="text-sm text-muted-foreground">Divisi, grup, dan cabang organisasi</p>
        </div>
        {userRole === "role-super-admin" && (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Unit
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => (
            <Card key={unit.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{unit.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {unit.description && (
                  <p className="text-sm text-muted-foreground">{unit.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={unit.isActive ? "success" : "secondary"}>
                    {unit.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAdd && (
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogHeader>
            <DialogTitle>Tambah Unit Organisasi</DialogTitle>
            <DialogDescription>Buat unit organisasi baru</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="name">Nama Unit</Label>
              <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nama unit" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="desc">Deskripsi</Label>
              <Input id="desc" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Deskripsi unit" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setNewName(""); setNewDesc("") }}>Batal</Button>
            <Button onClick={async () => {
              if (!newName.trim()) return
              try {
                const res = await fetch("/api/organization-units", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
                })
                if (!res.ok) throw new Error()
                const created = await res.json()
                setUnits((prev) => [...prev, created.data || created])
                toast.success("Unit berhasil ditambahkan")
                setShowAdd(false)
                setNewName("")
                setNewDesc("")
              } catch {
                toast.error("Gagal menambahkan unit")
              }
            }}>Simpan</Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  )
}
