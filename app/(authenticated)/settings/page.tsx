"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Save, Settings2, Users, Building2, Shield } from "lucide-react"

interface SettingsData {
  id: string
  organizationName: string
  activePeriod: string
  defaultTimezone: string
  defaultQuorumPercentage: number
  defaultRankingMethod: string
  allowPublicResultView: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState("general")

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => toast.error("Gagal memuat pengaturan"))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      toast.success("Pengaturan disimpan")
    } catch {
      toast.error("Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton className="h-96 rounded-xl" />
  if (!settings) return null

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Konfigurasi sistem EVote</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="general"><Settings2 className="h-4 w-4 mr-2" />Umum</TabsTrigger>
          <TabsTrigger value="voting"><Shield className="h-4 w-4 mr-2" />Voting</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Organisasi</CardTitle>
              <CardDescription>Nama dan periode organisasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Nama Organisasi</Label>
                <Input value={settings.organizationName} onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label>Periode Aktif</Label>
                  <Input value={settings.activePeriod} onChange={(e) => setSettings({ ...settings, activePeriod: e.target.value })} />
                </div>
                <div className="space-y-3">
                  <Label>Timezone</Label>
                  <Input value={settings.defaultTimezone} onChange={(e) => setSettings({ ...settings, defaultTimezone: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Konfigurasi Voting</CardTitle>
              <CardDescription>Pengaturan default untuk polling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <Label>Kuorum Default (%)</Label>
                  <Input type="number" value={settings.defaultQuorumPercentage} onChange={(e) => setSettings({ ...settings, defaultQuorumPercentage: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-3">
                  <Label>Metode Ranking</Label>
                  <Input value={settings.defaultRankingMethod} onChange={(e) => setSettings({ ...settings, defaultRankingMethod: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.allowPublicResultView} onChange={(e) => setSettings({ ...settings, allowPublicResultView: e.target.checked })} />
                <span className="text-sm">Izinkan publik melihat hasil voting</span>
              </label>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Button onClick={handleSave} disabled={saving}>
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Menyimpan..." : "Simpan Pengaturan"}
      </Button>
    </div>
  )
}
