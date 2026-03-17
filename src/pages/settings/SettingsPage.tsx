'use client'

import { useState } from 'react'
import { useData } from '@/lib/data-context'
import { TIPOS_SERVICIO } from '@/types'
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
  const [precios, setPrecios] = useState(settings.precios)
  const [logoPreview, setLogoPreview] = useState(settings.logoUrl)

  const handleSave = async () => {
    await updateSettings({ nombreGimnasio: nombre, precios, logoUrl: logoPreview })
    toast.success('Configuración guardada')
  }

  const handlePriceChange = (index: number, precio: number) => {
    setPrecios((prev) => prev.map((p, i) => (i === index ? { ...p, precio } : p)))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setLogoPreview(url)
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
                    <Upload className="h-3.5 w-3.5" /> Subir logo
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
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
            {precios.map((p, i) => (
              <div key={p.tipoServicio} className="flex items-center gap-3">
                <span className="text-muted-foreground min-w-0 flex-1 truncate text-sm">
                  {p.tipoServicio}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">$</span>
                  <Input
                    type="number"
                    value={p.precio}
                    onChange={(e) => handlePriceChange(i, Number(e.target.value))}
                    className="bg-background h-8 w-24 text-sm tabular-nums"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Button size="lg" onClick={handleSave}>
          <Save className="mr-1.5 h-4 w-4" /> Guardar Cambios
        </Button>
      </div>
    </div>
  )
}
