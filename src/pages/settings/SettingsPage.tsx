'use client'

import { useEffect, useState } from 'react'
import { useData } from '@/lib/data-context'
import { apiClient } from '@/lib/api-client'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Save, Upload } from 'lucide-react'

export default function SettingsPage() {
  const { settings, updateSettings } = useData()
  const [nombre, setNombre] = useState(settings.nombreGimnasio)
  const [priceInputs, setPriceInputs] = useState<string[]>(
    settings.precios.map((p) => String(p.precio)),
  )
  const [logoPreview, setLogoPreview] = useState(settings.logoUrl)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  useEffect(() => {
    setNombre(settings.nombreGimnasio)
    setPriceInputs(settings.precios.map((p) => String(p.precio)))
    setLogoPreview(settings.logoUrl)
  }, [settings])

  const handleSave = async () => {
    const precios = settings.precios.map((item, index) => {
      const raw = (priceInputs[index] ?? '').trim()
      const parsed = Number(raw)

      return {
        ...item,
        precio: Number.isFinite(parsed) && parsed >= 0 ? parsed : item.precio,
      }
    })

    await updateSettings({ nombreGimnasio: nombre.trim(), precios, logoUrl: logoPreview })
    toast.success('Configuración guardada')
  }

  const handlePriceChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    setPriceInputs((prev) => prev.map((price, i) => (i === index ? value : price)))
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)

    try {
      const response = await apiClient.settings.uploadLogo(file)
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error || 'No se pudo subir el logo')
      }

      const body = (await response.json()) as { data?: { url?: string } }
      const uploadedUrl = body.data?.url

      if (!uploadedUrl) {
        throw new Error('No se recibio URL del logo')
      }

      setLogoPreview(uploadedUrl)
      toast.success('Logo subido correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al subir logo')
    } finally {
      setIsUploadingLogo(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      <PageHeader title="Ajustes" description="Configuración del gimnasio" />

      <div className="grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Nombre del Gimnasio</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="bg-background mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Logo</Label>
              <div className="mt-1 flex items-center gap-3">
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="bg-background h-12 w-12 rounded-md object-cover"
                  />
                )}
                <label className="cursor-pointer">
                  <div className="border-border text-muted-foreground hover:bg-accent flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    {isUploadingLogo ? 'Subiendo...' : 'Subir logo'}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingLogo}
                    onChange={handleLogoChange}
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Precios por Servicio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {settings.precios.map((p, i) => (
              <div key={p.tipoServicio} className="flex items-center gap-3">
                <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm">
                  {p.tipoServicio}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">$</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={priceInputs[i] ?? ''}
                    onChange={(e) => handlePriceChange(i, e.target.value)}
                    className="bg-background h-8 w-24 text-sm tabular-nums"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Button size="lg" onClick={handleSave} disabled={isUploadingLogo}>
          <Save className="mr-1.5 h-4 w-4" /> Guardar Cambios
        </Button>
      </div>
    </div>
  )
}
