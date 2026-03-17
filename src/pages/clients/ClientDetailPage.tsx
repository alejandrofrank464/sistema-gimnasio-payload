'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useData } from '@/lib/data-context'
import { MESES } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge, PaymentStatusBadge } from '@/components/shared/StatusBadge'
import { ArrowLeft, Phone, Mail, Calendar, FileText } from 'lucide-react'
import { useClientsQuery } from '@/features/clients/hooks/use-clients-query'
import { useClientPaymentsInfiniteQuery } from '@/features/payments/hooks/use-payments-query'

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>()
  const rawId = params?.id
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const router = useRouter()
  const { settings } = useData()
  const { data: clients = [] } = useClientsQuery(settings)
  const {
    data: paymentsPages,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useClientPaymentsInfiniteQuery(id, 25)

  const client = id ? clients.find((c) => c.id === id) : undefined
  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground text-sm">Cliente no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/clientes')}>
          Volver
        </Button>
      </div>
    )
  }

  const paymentsByClient = useMemo(
    () => paymentsPages?.pages.flatMap((page) => page.docs) ?? [],
    [paymentsPages],
  )

  const now = new Date()
  const isActive = paymentsByClient.some(
    (p) => p.mes === now.getMonth() && p.anio === now.getFullYear(),
  )

  return (
    <div>
      <Button
        variant="ghost"
        size="lg"
        className="mb-4 text-sm"
        onClick={() => router.push('/clientes')}
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Volver a Clientes
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Client Info */}
        <Card className="bg-card border-border lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {client.nombre} {client.apellido}
              </CardTitle>
              <StatusBadge activo={isActive} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="text-muted-foreground h-3.5 w-3.5" />
              <span>{client.telefono}</span>
            </div>
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="text-muted-foreground h-3.5 w-3.5" />
                <span>{client.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="text-muted-foreground h-3.5 w-3.5" />
              <span>Desde {client.fechaRegistro}</span>
            </div>
            <div className="border-border border-t pt-2">
              <Badge variant="outline" className="text-2xs">
                {client.tipoServicio}
              </Badge>
              <p className="text-success mt-2 text-sm font-medium tabular-nums">
                ${client.precioMensual}/mes
              </p>
            </div>
            {client.notas && (
              <div className="border-border border-t pt-2">
                <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs">
                  <FileText className="h-3 w-3" /> Notas
                </div>
                <p className="text-sm">{client.notas}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Historial de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsByClient.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No hay pagos registrados.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  {paymentsByClient.map((p) => (
                    <div
                      key={p.id}
                      className="bg-background border-border flex items-center justify-between rounded-md border px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {MESES[p.mes]} {p.anio}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {p.metodoPago} · {p.tipoServicio} · {p.turno}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-success text-sm font-medium tabular-nums">
                          ${p.monto}
                        </span>
                        <PaymentStatusBadge estado={p.estado} />
                      </div>
                    </div>
                  ))}
                </div>

                {hasNextPage && (
                  <div className="pt-1">
                    <Button
                      variant="outline"
                      onClick={() => void fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? 'Cargando...' : 'Cargar mas pagos'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
